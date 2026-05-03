import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { MemoryModule } from './memory.module';

describe('MemoryModule', () => {
  it('compiles with the same global config pattern as AppModule (DI smoke)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), MemoryModule],
    }).compile();

    await moduleRef.close();
  });
});
