import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  // Separate secrets for better security
  accessTokenSecret:
    process.env.JWT_ACCESS_SECRET || 'change-this-access-secret',
  refreshTokenSecret:
    process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',

  // Short-lived access tokens
  accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',

  // Long-lived refresh tokens
  refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',

  // Cookie settings for browsers
  refreshTokenCookieName: 'refresh_token',
  cookieHttpOnly: true,
  cookieSecure: process.env.NODE_ENV === 'production', // HTTPS only in prod
  cookieSameSite: 'strict' as const,
  cookieMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
}));

