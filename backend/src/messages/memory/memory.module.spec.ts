import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { QDRANT_CLIENT } from '../../infrastructure/vector-store/qdrant-client.provider';
import { MemoryModule } from './memory.module';
import { MEMORY_EXTRACTION_PORT } from '../../inference/ports/memory-extraction.port';

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

const mockMemoryExtractionPort = {
  extract: jest.fn().mockResolvedValue([]),
};

describe('MemoryModule', () => {
  it('compiles with the same global config pattern as AppModule (DI smoke)', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), MemoryModule],
    })
      .overrideProvider(QDRANT_CLIENT)
      .useValue(mockQdrantClient)
      .overrideProvider(MEMORY_EXTRACTION_PORT)
      .useValue(mockMemoryExtractionPort)
      .compile();

    await moduleRef.close();
  });
});
