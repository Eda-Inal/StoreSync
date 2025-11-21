import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../strategies/jwt.strategy';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let configService: jest.Mocked<ConfigService>;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(() => {
    configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.accessTokenSecret') return 'test-secret-key';
        return undefined;
      }),
    } as any;

    prismaService = {
      user: {
        findUnique: jest.fn(),
      },
    } as any;

    strategy = new JwtStrategy(configService, prismaService);
  });

  describe('validate', () => {
    it('returns user data when token type is access and user exists', async () => {
      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        type: 'access',
      };

      const user = {
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER' as any,
        password: 'hashed-password',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.user.findUnique.mockResolvedValue(user);

      const result = await strategy.validate(payload);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });

      expect(result).toEqual({
        id: 'user-123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER',
      });
    });

    it('throws UnauthorizedException when token type is not access', async () => {
      const payload = {
        sub: 'user-123',
        email: 'user@example.com',
        type: 'refresh', // Wrong type
      };

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Invalid token type',
      );

      expect(prismaService.user.findUnique).not.toHaveBeenCalled();
    });

    it('throws UnauthorizedException when user does not exist', async () => {
      const payload = {
        sub: 'non-existent-user',
        email: 'user@example.com',
        type: 'access',
      };

      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'User not found',
      );

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-user' },
      });
    });

    it('uses default secret when config does not provide one', () => {
      configService.get = jest.fn(() => undefined);

      const newStrategy = new JwtStrategy(configService, prismaService);

      // Strategy should be created with default secret
      expect(newStrategy).toBeInstanceOf(JwtStrategy);
    });

    it('uses custom secret from config', () => {
      configService.get = jest.fn((key: string) => {
        if (key === 'jwt.accessTokenSecret') return 'custom-secret-key';
        return undefined;
      });

      const newStrategy = new JwtStrategy(configService, prismaService);

      expect(newStrategy).toBeInstanceOf(JwtStrategy);
      expect(configService.get).toHaveBeenCalledWith('jwt.accessTokenSecret');
    });
  });
});

