import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import type { SignOptions } from 'jsonwebtoken';

interface DeviceInfo {
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Generate and store refresh token with device info
   * Returns: { token: string, tokenFamily: string }
   */
  async generateRefreshToken(
    userId: string,
    deviceInfo?: DeviceInfo,
    tokenFamily?: string, // For rotation
    parentTokenId?: string, // For rotation
  ) {
    // Generate unique token family for new login sessions
    const family = tokenFamily || crypto.randomUUID();

    const payload = {
      sub: userId,
      type: 'refresh',
      family,
    };

    const secret =
      this.configService.get<string>('jwt.refreshTokenSecret') ??
      'default-refresh-secret';
    const expiresIn =
      (this.configService.get<string>('jwt.refreshTokenExpiration') ??
        '7d') as SignOptions['expiresIn'];

    const token = await this.jwtService.signAsync(payload, {
      secret,
      expiresIn,
    });

    // Hash token before storing (crypto is faster than bcrypt for this)
    const hashedToken = this.hashToken(token);

    // Calculate expiration date (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store in database
    await this.prisma.refreshToken.create({
      data: {
        hashedToken,
        userId,
        expiresAt,
        tokenFamily: family,
        parentTokenId,
        deviceName: deviceInfo?.deviceName,
        deviceType: deviceInfo?.deviceType,
        ipAddress: deviceInfo?.ipAddress,
        userAgent: deviceInfo?.userAgent,
      },
    });

    this.logger.log(`Generated refresh token for user ${userId}`);

    return { token, tokenFamily: family };
  }

  /**
   * Validate refresh token with constant-time comparison
   * Returns: { userId: string, tokenId: string, tokenFamily: string, user: User }
   */
  async validateRefreshToken(token: string) {
    try {
      // Verify JWT signature and expiration
      const secret =
        this.configService.get<string>('jwt.refreshTokenSecret') ??
        'default-refresh-secret';
      const payload = await this.jwtService.verifyAsync(token, { secret });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const hashedToken = this.hashToken(token);

      // Find token in database
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { hashedToken },
        include: { user: true },
      });

      if (!storedToken) {
        // Token not found - possible breach, revoke entire family
        this.logger.warn(
          `Refresh token not found - revoking family ${payload.family}`,
        );
        await this.revokeTokenFamily(payload.family);
        throw new UnauthorizedException('Token not found - family revoked');
      }

      // Use constant-time comparison for security
      const isValidHash = this.constantTimeCompare(
        hashedToken,
        storedToken.hashedToken,
      );

      if (!isValidHash) {
        this.logger.warn(
          `Invalid token hash - revoking family ${storedToken.tokenFamily}`,
        );
        await this.revokeTokenFamily(storedToken.tokenFamily);
        throw new UnauthorizedException('Invalid token - family revoked');
      }

      // Check if revoked
      if (storedToken.isRevoked) {
        // Attempted reuse of revoked token - revoke entire family
        this.logger.warn(
          `Revoked token reused - revoking family ${storedToken.tokenFamily}`,
        );
        await this.revokeTokenFamily(storedToken.tokenFamily);
        throw new UnauthorizedException('Token revoked - family revoked');
      }

      // Check expiration
      if (new Date() > storedToken.expiresAt) {
        throw new UnauthorizedException('Token expired');
      }

      // Update last used timestamp
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        userId: storedToken.userId,
        tokenId: storedToken.id,
        tokenFamily: storedToken.tokenFamily,
        user: storedToken.user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('Error validating refresh token', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * MANDATORY Token Rotation: Generate new tokens and revoke old one
   */
  async rotateRefreshToken(oldToken: string, deviceInfo?: DeviceInfo) {
    // Validate old token
    const validated = await this.validateRefreshToken(oldToken);

    // Revoke the old token
    await this.revokeRefreshToken(oldToken);

    // Generate new token in same family (rotation chain)
    const { token, tokenFamily } = await this.generateRefreshToken(
      validated.userId,
      deviceInfo,
      validated.tokenFamily, // Keep same family
      validated.tokenId, // Link to parent
    );

    this.logger.log(
      `Rotated refresh token for user ${validated.userId} in family ${tokenFamily}`,
    );

    return {
      token,
      tokenFamily,
      userId: validated.userId,
      user: validated.user,
    };
  }

  /**
   * Revoke a specific token
   */
  async revokeRefreshToken(token: string) {
    const hashedToken = this.hashToken(token);

    await this.prisma.refreshToken.updateMany({
      where: { hashedToken },
      data: { isRevoked: true },
    });

    this.logger.log('Revoked refresh token');
  }

  /**
   * Revoke entire token family (security breach detected)
   */
  async revokeTokenFamily(tokenFamily: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { tokenFamily },
      data: { isRevoked: true },
    });

    this.logger.warn(
      `Revoked token family ${tokenFamily} - ${result.count} tokens affected`,
    );
  }

  /**
   * Revoke all tokens for a user (account compromise)
   */
  async revokeAllUserTokens(userId: string) {
    const result = await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    this.logger.warn(
      `Revoked all tokens for user ${userId} - ${result.count} tokens affected`,
    );
  }

  /**
   * Get active sessions for a user
   */
  async getUserSessions(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        createdAt: true,
        lastUsedAt: true,
      },
      orderBy: { lastUsedAt: 'desc' },
    });
  }

  /**
   * Cleanup expired tokens (run periodically)
   */
  async cleanupExpiredTokens() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          {
            isRevoked: true,
            lastUsedAt: { lt: thirtyDaysAgo },
          },
        ],
      },
    });

    this.logger.log(`Cleaned up ${result.count} expired refresh tokens`);
    return result.count;
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

