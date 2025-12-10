import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RefreshTokenService } from './refresh-token.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dtos/login.dto';
import { RegisterDto } from './dtos/register.dto';
import type { SignOptions } from 'jsonwebtoken';

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

  async register(registerDto: RegisterDto, deviceInfo?: DeviceInfo) {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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

    return {
      user,
      accessToken,
      refreshToken,
    };
  }

  async login(loginDto: LoginDto, deviceInfo?: DeviceInfo) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await this.comparePasswords(
      password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate both tokens
    const accessToken = await this.generateAccessToken(user.id, user.email);
    const { token: refreshToken } =
      await this.refreshTokenService.generateRefreshToken(
        user.id,
        deviceInfo,
      );

    return {
      user,
      accessToken,
      refreshToken,
    };
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



