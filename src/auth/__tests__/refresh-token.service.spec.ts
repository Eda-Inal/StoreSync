import { RefreshTokenService } from '../refresh-token.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('RefreshTokenService.generateRefreshToken', () => {
  let service: RefreshTokenService;
  let prismaMock: {
    refreshToken: {
      create: jest.Mock;
    };
  };
  let jwtServiceMock: JwtService;
  let configServiceMock: ConfigService;
  let hashSpy: jest.SpyInstance;

  beforeEach(() => {
    prismaMock = {
      refreshToken: {
        create: jest.fn(),
      },
    };

    jwtServiceMock = {
      signAsync: jest.fn(),
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

    expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
      data: {
        hashedToken: 'hashed-token',
        userId: 'user-1',
        expiresAt: new Date('2025-01-08T00:00:00.000Z'),
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


