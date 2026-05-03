import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let reflector: { getAllAndOverride: jest.Mock };
  let parentCanActivate: jest.SpyInstance;

  function makeContext(): ExecutionContext {
    return {
      getHandler: () => function handler() {},
      getClass: () => class TestClass {},
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    const parentProto = Object.getPrototypeOf(JwtAuthGuard.prototype) as {
      canActivate: (...args: unknown[]) => unknown;
    };
    parentCanActivate = jest
      .spyOn(parentProto, 'canActivate')
      .mockReturnValue(Promise.resolve(true));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows public routes without invoking passport', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const guard = new JwtAuthGuard(reflector as unknown as Reflector);
    const ctx = makeContext();

    expect(guard.canActivate(ctx)).toBe(true);
    expect(parentCanActivate).not.toHaveBeenCalled();
  });

  it('delegates to passport for protected routes', () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const guard = new JwtAuthGuard(reflector as unknown as Reflector);

    void guard.canActivate(makeContext());

    expect(parentCanActivate).toHaveBeenCalled();
  });
});
