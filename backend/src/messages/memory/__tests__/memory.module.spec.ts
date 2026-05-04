import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { QDRANT_CLIENT } from '../../../infrastructure/vector-store/qdrant-client.provider';
import { MemoryModule } from '../memory.module';

/** Avoid real QdrantClient: its ctor fires async version checks that log after `close()` and trip Jest. */
const mockQdrantClient = {
  getCollection: jest.fn().mockResolvedValue({}),
  createCollection: jest.fn().mockResolvedValue(undefined),
  createPayloadIndex: jest.fn().mockResolvedValue(undefined),
  upsert: jest.fn().mockResolvedValue(undefined),
  search: jest.fn().mockResolvedValue([]),
  retrieve: jest.fn().mockResolvedValue([]),
  scroll: jest.fn().mockResolvedValue({ points: [] }),
  delete: jest.fn().mockResolvedValue(undefined),
};

describe('MemoryModule', () => {
  it('compiles with the same global config pattern as AppModule (DI smoke)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true, // smoke test: avoid reading `.env` (CI/sandbox may block)
        }),
        MemoryModule,
      ],
    })
      .overrideProvider(QDRANT_CLIENT)
      .useValue(mockQdrantClient)
      .compile();

    await moduleRef.close();
  });
});
