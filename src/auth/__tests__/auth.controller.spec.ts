import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { RefreshTokenService } from '../refresh-token.service';
import { ConfigService } from '@nestjs/config';
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from 'express';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let refreshTokenService: jest.Mocked<RefreshTokenService>;
  let configService: jest.Mocked<ConfigService>;
  let mockRequest: Partial<ExpressRequest & { cookies?: Record<string, string> }>;
  let mockResponse: Partial<ExpressResponse>;

  beforeEach(() => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      generateAccessToken: jest.fn(),
    } as any;

    refreshTokenService = {
      rotateRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      getUserSessions: jest.fn(),
    } as any;

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'jwt.refreshTokenCookieName') return 'refresh_token';
        if (key === 'jwt.cookieHttpOnly') return true;
        if (key === 'jwt.cookieSecure') return false;
        if (key === 'jwt.cookieSameSite') return 'strict';
        if (key === 'jwt.cookieMaxAge') return 7 * 24 * 60 * 60 * 1000;
        return undefined;
      }),
    } as any;

    mockRequest = {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'Mozilla/5.0 Chrome/91.0',
      },
      cookies: {},
    };

    mockResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };

    controller = new AuthController(
      authService,
      refreshTokenService,
      configService,
    );
  });

  describe('register', () => {
    it('calls authService.register with device info and sets refresh token cookie', async () => {
      const registerDto = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      const serviceResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 900,
        user: {
          id: 'user-1',
          email: 'new@example.com',
          name: 'New User',
          role: 'USER' as any,
        },
      };

      authService.register.mockResolvedValue(serviceResult);

      const result = await controller.register(
        registerDto as any,
        mockRequest as ExpressRequest,
        mockResponse as ExpressResponse,
      );

      expect(authService.register).toHaveBeenCalledWith(registerDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        deviceType: 'desktop',
        deviceName: 'Chrome Browser',
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );

      expect(result).toEqual({
        access_token: 'access-token',
        expires_in: 900,
        user: serviceResult.user,
      });
      expect(result).not.toHaveProperty('refresh_token');
    });
  });

  describe('login', () => {
    it('calls authService.login with device info and sets refresh token cookie', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'password123',
      };

      const serviceResult = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expires_in: 900,
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'User',
          role: 'USER' as any,
        },
      };

      authService.login.mockResolvedValue(serviceResult);

      const result = await controller.login(
        loginDto as any,
        mockRequest as ExpressRequest,
        mockResponse as ExpressResponse,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 Chrome/91.0',
        deviceType: 'desktop',
        deviceName: 'Chrome Browser',
      });

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'refresh-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );

      expect(result).toEqual({
        access_token: 'access-token',
        expires_in: 900,
        user: serviceResult.user,
      });
      expect(result).not.toHaveProperty('refresh_token');
    });
  });

  describe('refresh', () => {
    it('rotates refresh token and returns new access token', async () => {
      mockRequest.cookies = { refresh_token: 'old-refresh-token' };

      const rotatedResult = {
        token: 'new-refresh-token',
        tokenFamily: 'family-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
        },
      };

      refreshTokenService.rotateRefreshToken.mockResolvedValue(
        rotatedResult as any,
      );
      authService.generateAccessToken.mockResolvedValue('new-access-token');

      const result = await controller.refresh(
        mockRequest as any,
        mockResponse as ExpressResponse,
      );

      expect(refreshTokenService.rotateRefreshToken).toHaveBeenCalledWith(
        'old-refresh-token',
        {
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0 Chrome/91.0',
          deviceType: 'desktop',
          deviceName: 'Chrome Browser',
        },
      );

      expect(authService.generateAccessToken).toHaveBeenCalledWith(
        'user-1',
        'user@example.com',
      );

      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'new-refresh-token',
        {
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        },
      );

      expect(result).toEqual({
        access_token: 'new-access-token',
        expires_in: 900,
      });
    });

    it('throws UnauthorizedException when refresh token cookie is missing', async () => {
      mockRequest.cookies = {};

      await expect(
        controller.refresh(mockRequest as any, mockResponse as ExpressResponse),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenService.rotateRefreshToken).not.toHaveBeenCalled();
      expect(authService.generateAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('revokes refresh token and clears cookie when token exists', async () => {
      mockRequest.cookies = { refresh_token: 'token-to-revoke' };

      const result = await controller.logout(
        mockRequest as any,
        mockResponse as ExpressResponse,
      );

      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'token-to-revoke',
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('clears cookie even when no refresh token exists', async () => {
      mockRequest.cookies = {};

      const result = await controller.logout(
        mockRequest as any,
        mockResponse as ExpressResponse,
      );

      expect(refreshTokenService.revokeRefreshToken).not.toHaveBeenCalled();
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });

    it('uses custom cookie name from config', async () => {
      (configService.get as jest.Mock) = jest.fn((key: string) => {
        if (key === 'jwt.refreshTokenCookieName') return 'custom_refresh';
        return undefined;
      });

      mockRequest.cookies = {};

      await controller.logout(mockRequest as any, mockResponse as ExpressResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('custom_refresh');
    });
  });

  describe('getProfile', () => {
    it('returns user profile from request', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'USER',
      };

      mockRequest.user = mockUser;

      const result = await controller.getProfile(mockRequest as any);

      expect(result).toEqual({
        user: {
          id: 'user-1',
          email: 'user@example.com',
          name: 'Test User',
        },
      });
    });
  });

  describe('getSessions', () => {
    it('returns user sessions from refreshTokenService', async () => {
      const mockUser = { id: 'user-1' };
      const mockSessions = [
        {
          id: 'session-1',
          deviceName: 'Chrome Browser',
          deviceType: 'desktop',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
        {
          id: 'session-2',
          deviceName: 'iPhone',
          deviceType: 'mobile',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ];

      mockRequest.user = mockUser;
      refreshTokenService.getUserSessions.mockResolvedValue(
        mockSessions as any,
      );

      const result = await controller.getSessions(mockRequest as any);

      expect(refreshTokenService.getUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(result).toEqual({ sessions: mockSessions });
    });
  });

  describe('revokeSession', () => {
    it('revokes session when it belongs to user', async () => {
      const mockUser = { id: 'user-1' };
      const mockSessions = [
        {
          id: 'session-1',
          deviceName: 'Chrome Browser',
          deviceType: 'desktop',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
        {
          id: 'session-2',
          deviceName: 'iPhone',
          deviceType: 'mobile',
          ipAddress: '192.168.1.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ];

      mockRequest.user = mockUser;
      refreshTokenService.getUserSessions.mockResolvedValue(
        mockSessions as any,
      );

      const result = await controller.revokeSession(
        'session-1',
        mockRequest as any,
      );

      expect(refreshTokenService.getUserSessions).toHaveBeenCalledWith(
        'user-1',
      );
      expect(refreshTokenService.revokeRefreshToken).toHaveBeenCalledWith(
        'session-1',
      );
      expect(result).toEqual({ message: 'Session revoked successfully' });
    });

    it('throws UnauthorizedException when session does not belong to user', async () => {
      const mockUser = { id: 'user-1' };
      const mockSessions = [
        {
          id: 'session-1',
          deviceName: 'Chrome Browser',
          deviceType: 'desktop',
          ipAddress: '127.0.0.1',
          createdAt: new Date(),
          lastUsedAt: new Date(),
        },
      ];

      mockRequest.user = mockUser;
      refreshTokenService.getUserSessions.mockResolvedValue(
        mockSessions as any,
      );

      await expect(
        controller.revokeSession('session-999', mockRequest as any),
      ).rejects.toThrow(UnauthorizedException);

      expect(refreshTokenService.revokeRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('device info extraction', () => {
    it('detects mobile device type', async () => {
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0 iPhone Mobile Safari',
      };

      const loginDto = { email: 'user@example.com', password: 'pass123' };
      authService.login.mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 900,
        user: { id: '1', email: 'user@example.com', name: 'User', role: 'USER' },
      });

      await controller.login(
        loginDto as any,
        mockRequest as ExpressRequest,
        mockResponse as ExpressResponse,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 iPhone Mobile Safari',
        deviceType: 'mobile',
        deviceName: 'Safari Browser',
      });
    });

    it('detects tablet device type', async () => {
      mockRequest.headers = {
        'user-agent': 'Mozilla/5.0 iPad Tablet Safari',
      };

      const loginDto = { email: 'user@example.com', password: 'pass123' };
      authService.login.mockResolvedValue({
        access_token: 'token',
        refresh_token: 'refresh',
        expires_in: 900,
        user: { id: '1', email: 'user@example.com', name: 'User', role: 'USER' },
      });

      await controller.login(
        loginDto as any,
        mockRequest as ExpressRequest,
        mockResponse as ExpressResponse,
      );

      expect(authService.login).toHaveBeenCalledWith(loginDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0 iPad Tablet Safari',
        deviceType: 'tablet',
        deviceName: 'Safari Browser',
      });
    });

    it('extracts browser names correctly', async () => {
      const browsers = [
        { ua: 'Mozilla/5.0 Chrome/91.0', expected: 'Chrome Browser' },
        { ua: 'Mozilla/5.0 Firefox/89.0', expected: 'Firefox Browser' },
        { ua: 'Mozilla/5.0 Safari/14.0', expected: 'Safari Browser' },
        { ua: 'Mozilla/5.0 Edge/91.0', expected: 'Edge Browser' },
      ];

      for (const { ua, expected } of browsers) {
        mockRequest.headers = { 'user-agent': ua };
        authService.login.mockResolvedValue({
          access_token: 'token',
          refresh_token: 'refresh',
          expires_in: 900,
          user: { id: '1', email: 'user@example.com', name: 'User', role: 'USER' },
        });

        await controller.login(
          { email: 'user@example.com', password: 'pass123' } as any,
          mockRequest as ExpressRequest,
          mockResponse as ExpressResponse,
        );

        expect(authService.login).toHaveBeenCalledWith(
          expect.any(Object),
          expect.objectContaining({ deviceName: expected }),
        );
      }
    });
  });
});

