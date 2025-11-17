import { ConflictException } from '@nestjs/common';
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

});

