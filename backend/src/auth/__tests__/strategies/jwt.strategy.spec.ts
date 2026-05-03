import { JwtStrategy } from '../../strategies/jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(() => {
    strategy = new JwtStrategy();
  });

  it('should map payload.sub to userId', () => {
    expect(strategy.validate({ sub: 'user-123' })).toEqual({
      userId: 'user-123',
    });
  });
});
