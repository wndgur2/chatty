import { of } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { ExecutionContext } from '@nestjs/common';
import { BigIntSerializerInterceptor } from './bigint-serializer.interceptor';

describe('BigIntSerializerInterceptor', () => {
  const interceptor = new BigIntSerializerInterceptor();
  const noopContext = {} as ExecutionContext;

  async function serializeThrough(data: unknown): Promise<unknown> {
    const obs = interceptor.intercept(noopContext, {
      handle: () => of(data),
    });
    return lastValueFrom(obs);
  }

  it('stringifies bigint', async () => {
    await expect(serializeThrough(10n)).resolves.toBe('10');
  });

  it('passes Date through unchanged', async () => {
    const d = new Date('2020-01-01T00:00:00.000Z');
    await expect(serializeThrough(d)).resolves.toBe(d);
  });

  it('serializes nested objects and arrays', async () => {
    const input = {
      id: 1n,
      tags: [2n, { nested: 3n }],
      empty: null,
    };
    await expect(serializeThrough(input)).resolves.toEqual({
      id: '1',
      tags: ['2', { nested: '3' }],
      empty: null,
    });
  });

  it('returns primitives as-is', async () => {
    await expect(serializeThrough('x')).resolves.toBe('x');
    await expect(serializeThrough(1)).resolves.toBe(1);
    await expect(serializeThrough(true)).resolves.toBe(true);
  });
});
