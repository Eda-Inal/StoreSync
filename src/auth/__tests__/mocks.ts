/**
 * Shared mock factories for Auth module tests.
 * Export helpers for PrismaService, ConfigService, JwtService, etc.
 */

export const createPrismaMock = () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
    deleteMany: jest.fn(),
  },
});

export const createJwtServiceMock = () => ({
  signAsync: jest.fn(),
  verifyAsync: jest.fn(),
});

export const createConfigServiceMock = (overrides: Record<string, unknown> = {}) => ({
  get: jest.fn((key: string) => overrides[key]),
});


