import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindHistoryQueryDto } from './find-history-query.dto';

describe('FindHistoryQueryDto', () => {
  async function validatePlain(input: Record<string, unknown>) {
    const dto = plainToInstance(FindHistoryQueryDto, input);
    return validate(dto);
  }

  it('accepts valid limit and offset', async () => {
    const errors = await validatePlain({ limit: 50, offset: 0 });
    expect(errors).toHaveLength(0);
  });

  it('rejects limit above 100', async () => {
    const errors = await validatePlain({ limit: 101 });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('rejects negative offset', async () => {
    const errors = await validatePlain({ offset: -1 });
    expect(errors.length).toBeGreaterThan(0);
  });
});
