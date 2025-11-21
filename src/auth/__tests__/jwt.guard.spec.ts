import { JwtAuthGuard } from '../guards/jwt.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;

  beforeEach(() => {
    guard = new JwtAuthGuard();
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should be an instance of JwtAuthGuard', () => {
    expect(guard).toBeInstanceOf(JwtAuthGuard);
  });

  it('should have canActivate method', () => {
    expect(guard.canActivate).toBeDefined();
    expect(typeof guard.canActivate).toBe('function');
  });

  it('should be injectable', () => {
    // JwtAuthGuard is decorated with @Injectable()
    // This test verifies the guard can be instantiated
    const newGuard = new JwtAuthGuard();
    expect(newGuard).toBeDefined();
  });
});

