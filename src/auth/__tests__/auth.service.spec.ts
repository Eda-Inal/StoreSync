import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { RefreshTokenService } from '../refresh-token.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService.register - user existence + creation', () => {
  let authService: AuthService;
  let prismaMock: {
    user: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };
  let refreshTokenService: RefreshTokenService;
  let comparePasswordsSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };

    refreshTokenService = {
      generateRefreshToken: jest.fn(),
    } as unknown as RefreshTokenService;

    const jwtService = {
      signAsync: jest.fn(),
    } as unknown as JwtService;

    const configService = {
      get: jest.fn(),
    } as unknown as ConfigService;

    authService = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtService,
      refreshTokenService,
      configService,
    );

    // Stub downstream private helpers
    jest
      .spyOn(authService as any, 'hashPassword')
      .mockResolvedValue('hashed-password');
    comparePasswordsSpy = jest
      .spyOn(authService as any, 'comparePasswords')
      .mockResolvedValue(true);
    jest
      .spyOn(authService, 'generateAccessToken')
      .mockResolvedValue('access-token');
    (refreshTokenService.generateRefreshToken as jest.Mock).mockResolvedValue({
      token: 'refresh-token',
    });
  });

  describe('happy path - user does not exist', () => {
    it('creates the user via Prisma and returns the created user data', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };
      const createdUser = {
        id: 'user-1',
        email: registerDto.email,
        name: registerDto.name,
        password: 'hashed-password',
        role: 'USER',
      };

      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(createdUser);

      const result = await authService.register(registerDto);

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prismaMock.user.create).toHaveBeenCalledWith({
        data: {
          email: registerDto.email,
          password: 'hashed-password',
          name: registerDto.name,
        },
      });
      expect(result.user).toEqual({
        id: createdUser.id,
        email: createdUser.email,
        name: createdUser.name,
        role: createdUser.role,
      });
    });
  });

  describe('edge case - user already exists', () => {
    it('throws ConflictException and does not create a user', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Existing User',
      };

      prismaMock.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: registerDto.email,
      });

      await expect(authService.register(registerDto)).rejects.toBeInstanceOf(
        ConflictException,
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: registerDto.email },
      });
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
  });

  describe('AuthService.login - user lookup + password validation', () => {
    it('returns tokens when user exists and password matches', async () => {
      const loginDto = { email: 'user@example.com', password: 'password123' };
      const foundUser = {
        id: 'user-123',
        email: loginDto.email,
        password: 'hashed-password',
        name: 'Tester',
        role: 'USER',
      };
      prismaMock.user.findUnique.mockResolvedValue(foundUser);

      const result = await authService.login(loginDto, { deviceType: 'web' });

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(comparePasswordsSpy).toHaveBeenCalledWith(
        loginDto.password,
        foundUser.password,
      );
      expect(refreshTokenService.generateRefreshToken).toHaveBeenCalledWith(
        foundUser.id,
        { deviceType: 'web' },
      );
      expect(result).toEqual({
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 900,
        user: {
          id: foundUser.id,
          email: foundUser.email,
          name: foundUser.name,
          role: foundUser.role,
        },
      });
    });

    it('throws UnauthorizedException when user is not found', async () => {
      const loginDto = { email: 'missing@example.com', password: 'password123' };
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(comparePasswordsSpy).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when password does not match', async () => {
      const loginDto = { email: 'user@example.com', password: 'wrongpass' };
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email: loginDto.email,
        password: 'hashed-password',
      });
      comparePasswordsSpy.mockResolvedValueOnce(false);

      await expect(authService.login(loginDto)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );

      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: loginDto.email },
      });
      expect(refreshTokenService.generateRefreshToken).not.toHaveBeenCalled();
    });
  });
});

