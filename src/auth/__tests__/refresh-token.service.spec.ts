import { RefreshTokenService } from '../refresh-token.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('RefreshTokenService', () => {
  let service: RefreshTokenService;
  let prismaMock: {
    refreshToken: {
      create: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      updateMany: jest.Mock;
      deleteMany: jest.Mock;
    };
  };
  let jwtServiceMock: JwtService;
  let configServiceMock: ConfigService;
  let hashSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaMock = {
      refreshToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.refreshTokenSecret') return 'refresh-secret';
        if (key === 'jwt.refreshTokenExpiration') return '7d';
        return undefined;
      }),
    } as unknown as ConfigService;

    service = new RefreshTokenService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock,
      configServiceMock,
    );

    hashSpy = jest
      .spyOn(service as any, 'hashToken')
      .mockReturnValue('hashed-token');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('generateRefreshToken', () => {
    it('creates a new token family, persists device metadata, and stores hashed token', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

    (jwtServiceMock.signAsync as jest.Mock).mockResolvedValue('refresh.jwt');

    const deviceInfo = {
      deviceName: 'Chrome Browser',
      deviceType: 'desktop',
      ipAddress: '127.0.0.1',
      userAgent: 'Chrome',
    };

    const result = await service.generateRefreshToken('user-1', deviceInfo);

    const { tokenFamily } = result;
    expect(tokenFamily).toEqual(expect.any(String));
    expect(jwtServiceMock.signAsync as jest.Mock).toHaveBeenCalledWith(
      { sub: 'user-1', type: 'refresh', family: tokenFamily },
      { secret: 'refresh-secret', expiresIn: '7d' },
    );
    expect(hashSpy).toHaveBeenCalledWith('refresh.jwt');

    const expectedExpiry = new Date('2025-01-08T00:00:00.000Z');
    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
      data: {
        hashedToken: 'hashed-token',
        userId: 'user-1',
        expiresAt: expectedExpiry,
        tokenFamily,
        parentTokenId: undefined,
        deviceName: 'Chrome Browser',
        deviceType: 'desktop',
        ipAddress: '127.0.0.1',
        userAgent: 'Chrome',
      },
    });

      expect(result).toEqual({
        token: 'refresh.jwt',
        tokenFamily,
      });
    });

    it('reuses a provided family and links to parent token when rotating', async () => {
    (jwtServiceMock.signAsync as jest.Mock).mockResolvedValue('rotated.jwt');

    const result = await service.generateRefreshToken(
      'user-2',
      undefined,
      'existing-family',
      'parent-123',
    );

    expect(jwtServiceMock.signAsync as jest.Mock).toHaveBeenCalledWith(
      { sub: 'user-2', type: 'refresh', family: 'existing-family' },
      { secret: 'refresh-secret', expiresIn: '7d' },
    );

    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
      data: {
        hashedToken: 'hashed-token',
        userId: 'user-2',
        expiresAt: expect.any(Date),
        tokenFamily: 'existing-family',
        parentTokenId: 'parent-123',
        deviceName: undefined,
        deviceType: undefined,
        ipAddress: undefined,
        userAgent: undefined,
      },
    });

      expect(result).toEqual({
        token: 'rotated.jwt',
        tokenFamily: 'existing-family',
      });
    });
  });

  describe('validateRefreshToken', () => {
    let constantCompareSpy: jest.SpyInstance;
    let revokeFamilySpy: jest.SpyInstance;

    beforeEach(() => {
      constantCompareSpy = jest
        .spyOn(service as any, 'constantTimeCompare')
        .mockReturnValue(true);
      revokeFamilySpy = jest
        .spyOn(service, 'revokeTokenFamily')
        .mockResolvedValue(undefined);
    });

    it('returns token metadata when JWT, hash, and DB record all match', async () => {
      const payload = {
        sub: 'user-1',
        type: 'refresh',
        family: 'family-1',
      };
      (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValue(payload);
      (service as any).hashToken.mockReturnValueOnce('hashed-token');

      const storedToken = {
        id: 'token-1',
        hashedToken: 'hashed-token',
        userId: 'user-1',
        tokenFamily: 'family-1',
        isRevoked: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User One',
        },
      };
      prismaMock.refreshToken.findUnique.mockResolvedValue(storedToken);
      prismaMock.refreshToken.update.mockResolvedValue(storedToken);

      const result = await service.validateRefreshToken('raw-token');

      expect(jwtServiceMock.verifyAsync as jest.Mock).toHaveBeenCalledWith(
        'raw-token',
        { secret: 'refresh-secret' },
      );
      expect(prismaMock.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { hashedToken: 'hashed-token' },
        include: { user: true },
      });
      expect(prismaMock.refreshToken.update).toHaveBeenCalledWith({
        where: { id: storedToken.id },
        data: { lastUsedAt: expect.any(Date) },
      });
      expect(revokeFamilySpy).not.toHaveBeenCalled();
      expect(result).toEqual({
        userId: 'user-1',
        tokenId: 'token-1',
        tokenFamily: 'family-1',
        user: storedToken.user,
      });
    });

    it('throws unauthorized when JWT payload is not refresh type', async () => {
      (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        type: 'access',
        family: 'family-1',
      });

      await expect(
        service.validateRefreshToken('access-token'),
      ).rejects.toThrow('Invalid token type');

      expect(prismaMock.refreshToken.findUnique).not.toHaveBeenCalled();
    });

    it('revokes token family when stored token missing and surfaces unauthorized', async () => {
      const payload = {
        sub: 'user-1',
        type: 'refresh',
        family: 'missing-family',
      };
      (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValue(payload);
      prismaMock.refreshToken.findUnique.mockResolvedValue(null);

      await expect(
        service.validateRefreshToken('no-record'),
      ).rejects.toThrow('Token not found - family revoked');

      expect(revokeFamilySpy).toHaveBeenCalledWith('missing-family');
    });

    it('revokes family when hash comparison fails', async () => {
      (jwtServiceMock.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'user-1',
        type: 'refresh',
        family: 'family-xyz',
      });
      (service as any).hashToken.mockReturnValueOnce('incoming-hash');
      const storedToken = {
        id: 'token-2',
        hashedToken: 'stored-hash',
        tokenFamily: 'family-xyz',
        userId: 'user-1',
        isRevoked: false,
        expiresAt: new Date('2025-01-08T00:00:00.000Z'),
        user: {} as any,
      };
      prismaMock.refreshToken.findUnique.mockResolvedValue(storedToken);
      constantCompareSpy.mockReturnValueOnce(false);

      await expect(
        service.validateRefreshToken('tampered'),
      ).rejects.toThrow('Invalid token - family revoked');

      expect(revokeFamilySpy).toHaveBeenCalledWith('family-xyz');
      expect(prismaMock.refreshToken.update).not.toHaveBeenCalled();
    });
  });
});


