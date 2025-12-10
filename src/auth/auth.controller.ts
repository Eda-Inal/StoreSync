import {
  Controller,
  Post,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
  Request,
  Response,
  HttpCode,
} from '@nestjs/common';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { sendResponse, sendError } from '../helper/response.helper';

interface DeviceInfo {
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const result = await this.authService.register(registerDto, deviceInfo);

    // Check if result is an error response
    if (!result.success || !('data' in result)) {
      return result;
    }

    // Set httpOnly cookie for browsers
    this.setRefreshTokenCookie(res, result.data.refresh_token);

    // Omit refresh token from body
    const { refresh_token, ...responseBody } = result.data;
    return sendResponse(responseBody);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Request() req: ExpressRequest,
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const deviceInfo = this.extractDeviceInfo(req);
    const result = await this.authService.login(loginDto, deviceInfo);

    // Check if result is an error response
    if (!result.success || !('data' in result)) {
      return result;
    }

    // Set httpOnly cookie for browsers
    this.setRefreshTokenCookie(res, result.data.refresh_token);

    const { refresh_token, ...responseBody } = result.data;
    return sendResponse(responseBody);
  }

  @Post('refresh')
  async refresh(
    @Request() req: ExpressRequest & { cookies?: Record<string, string> },
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return sendError('Refresh token not provided', 401);
    }

    try {
      const deviceInfo = this.extractDeviceInfo(req);

      // MANDATORY ROTATION
      const rotated = await this.refreshTokenService.rotateRefreshToken(
        refreshToken,
        deviceInfo,
      );

      // Generate new access token
      const accessToken = await this.authService.generateAccessToken(
        rotated.user.id,
        rotated.user.email,
      );

      // Set new refresh token in cookie
      this.setRefreshTokenCookie(res, rotated.token);

      return sendResponse({
        access_token: accessToken,
        expires_in: 900, // 15 minutes in seconds
      });
    } catch (error) {
      return sendError('Invalid or expired refresh token', 401);
    }
  }

  @Post('logout')
  async logout(
    @Request() req: ExpressRequest & { cookies?: Record<string, string> },
    @Response({ passthrough: true }) res: ExpressResponse,
  ) {
    const refreshToken =
      req.cookies?.refresh_token;

    if (refreshToken) {
      await this.refreshTokenService.revokeRefreshToken(refreshToken);
    }

    // Clear cookie
    const cookieName =
      this.configService.get<string>('jwt.refreshTokenCookieName') ??
      'refresh_token';
    res.clearCookie(cookieName);

    return sendResponse({ message: 'Logged out successfully' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return sendResponse({
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Request() req) {
    const sessions = await this.refreshTokenService.getUserSessions(
      req.user.id,
    );
    return sendResponse({ sessions });
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  @HttpCode(204)
  async revokeSession(
    @Param('sessionId') sessionId: string,
    @Request() req,
  ) {
    // Get the session to verify ownership
    const sessions = await this.refreshTokenService.getUserSessions(
      req.user.id,
    );
    const session = sessions.find((s) => s.id === sessionId);

    if (!session) {
      return sendError('Session not found or does not belong to you', 404);
    }

    // Revoke the session
    await this.refreshTokenService.revokeRefreshToken(sessionId);
  }

  // Helper methods
  private extractDeviceInfo(req: ExpressRequest): DeviceInfo {
    const userAgent = req.headers['user-agent'] || '';
    return {
      ipAddress: req.ip,
      userAgent,
      deviceType: this.detectDeviceType(userAgent),
      deviceName: this.extractDeviceName(userAgent),
    };
  }

  private detectDeviceType(userAgent: string): string {
    if (/mobile/i.test(userAgent)) return 'mobile';
    if (/tablet/i.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private extractDeviceName(userAgent: string): string {
    // Simple extraction - can use a library like ua-parser-js for better results
    if (userAgent.includes('Chrome')) return 'Chrome Browser';
    if (userAgent.includes('Firefox')) return 'Firefox Browser';
    if (userAgent.includes('Safari')) return 'Safari Browser';
    if (userAgent.includes('Edge')) return 'Edge Browser';
    return 'Unknown Device';
  }

  private setRefreshTokenCookie(res: ExpressResponse, token: string) {
    const cookieName =
      this.configService.get<string>('jwt.refreshTokenCookieName') ??
      'refresh_token';
    const httpOnly =
      this.configService.get<boolean>('jwt.cookieHttpOnly') ?? true;
    const secure = this.configService.get<boolean>('jwt.cookieSecure') ?? false;
    const sameSite =
      this.configService.get<'strict' | 'lax' | 'none'>('jwt.cookieSameSite') ??
      'strict';
    const maxAge =
      this.configService.get<number>('jwt.cookieMaxAge') ??
      7 * 24 * 60 * 60 * 1000;

    res.cookie(cookieName, token, {
      httpOnly,
      secure,
      sameSite,
      maxAge,
    });
  }
}



