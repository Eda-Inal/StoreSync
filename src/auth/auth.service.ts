import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import type { SignOptions } from 'jsonwebtoken';
import { sendResponse, sendError } from '../helper/response.helper';

interface DeviceInfo {
  deviceName?: string;
  deviceType?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private refreshTokenService: RefreshTokenService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto, deviceInfo?: DeviceInfo): Promise<{success: boolean, data: {access_token: string, refresh_token: string, expires_in: number, user: {id: string, email: string, name: string, role: string}}} | {success: boolean, statusCode: number, message: string}> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return sendError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await this.hashPassword(password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    });

    // Generate both tokens
    const accessToken = await this.generateAccessToken(user.id, user.email);
    const { token: refreshToken } =
      await this.refreshTokenService.generateRefreshToken(
        user.id,
        deviceInfo,
      );

    return sendResponse({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }

  async login(loginDto: LoginDto, deviceInfo?: DeviceInfo): Promise<{success: boolean, data: {access_token: string, refresh_token: string, expires_in: number, user: {id: string, email: string, name: string, role: string}}} | {success: boolean, statusCode: number, message: string}> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return sendError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      return sendError('Invalid credentials', 401);
    }

    // Generate both tokens
    const accessToken = await this.generateAccessToken(user.id, user.email);
    const { token: refreshToken } =
      await this.refreshTokenService.generateRefreshToken(
        user.id,
        deviceInfo,
      );

    return sendResponse({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePasswords(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  async generateAccessToken(userId: string, email: string): Promise<string> {
    const payload = { sub: userId, email, type: 'access' };
    const secret =
      this.configService.get<string>('jwt.accessTokenSecret') ??
      'default-access-secret';
    const expiresIn =
      (this.configService.get<string>('jwt.accessTokenExpiration') ??
        '15m') as SignOptions['expiresIn'];

    return this.jwtService.signAsync(payload, { secret, expiresIn });
  }

}



