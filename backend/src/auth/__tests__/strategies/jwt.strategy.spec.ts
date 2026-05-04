import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../../strategies/jwt.strategy';
import { JWT_CLAIM_TYP_GUEST } from '../../constants/jwt-claims.constants';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  const mockPrisma = {
    guestSession: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(() => {
    mockPrisma.guestSession.findUnique.mockReset();
    strategy = new JwtStrategy(mockPrisma as never);
  });

  it('should map legacy member payload to user principal', async () => {
    await expect(strategy.validate({ sub: '42' })).resolves.toEqual({
      mode: 'user',
      userId: '42',
    });
    expect(mockPrisma.guestSession.findUnique).not.toHaveBeenCalled();
  });

  it('should map guest payload to guest principal when session is active', async () => {
    mockPrisma.guestSession.findUnique.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      mergedAt: null,
    });

    await expect(
      strategy.validate({
        sub: '550e8400-e29b-41d4-a716-446655440000',
        typ: JWT_CLAIM_TYP_GUEST,
      }),
    ).resolves.toEqual({
      mode: 'guest',
      guestSessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('should reject guest token when session is merged', async () => {
    mockPrisma.guestSession.findUnique.mockResolvedValue({
      id: '550e8400-e29b-41d4-a716-446655440000',
      mergedAt: new Date(),
    });

    await expect(
      strategy.validate({
        sub: '550e8400-e29b-41d4-a716-446655440000',
        typ: JWT_CLAIM_TYP_GUEST,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
