import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { QdrantVectorStoreAdapter } from './qdrant-vector-store.adapter';
import { QDRANT_CLIENT } from './qdrant-client.provider';

const mockQdrantClient = {
  getCollection: jest.fn(),
  createCollection: jest.fn(),
  createPayloadIndex: jest.fn(),
  upsert: jest.fn(),
  search: jest.fn(),
  retrieve: jest.fn(),
  scroll: jest.fn(),
  delete: jest.fn(),
};

describe('QdrantVectorStoreAdapter', () => {
  let adapter: QdrantVectorStoreAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QdrantVectorStoreAdapter,
        { provide: QDRANT_CLIENT, useValue: mockQdrantClient },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_: string, fallback: string | number) => fallback),
          },
        },
      ],
    }).compile();

    adapter = module.get<QdrantVectorStoreAdapter>(QdrantVectorStoreAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates collection and payload indexes when missing', async () => {
    mockQdrantClient.getCollection.mockRejectedValue(new Error('not found'));

    await adapter.onModuleInit();

    expect(mockQdrantClient.createCollection).toHaveBeenCalledWith(
      'chat_memory',
      {
        vectors: { size: 384, distance: 'Cosine' },
      },
    );
    expect(mockQdrantClient.createPayloadIndex).toHaveBeenCalledWith(
      'chat_memory',
      { field_name: 'chatroomId', field_schema: 'integer' },
    );
    expect(mockQdrantClient.createPayloadIndex).toHaveBeenCalledWith(
      'chat_memory',
      { field_name: 'messageId', field_schema: 'keyword' },
    );
    expect(mockQdrantClient.createPayloadIndex).toHaveBeenCalledWith(
      'chat_memory',
      { field_name: 'memoryType', field_schema: 'keyword' },
    );
  });

  it('builds search filters with chatroom, type, and exclusions', async () => {
    mockQdrantClient.search.mockResolvedValue([
      {
        id: '1',
        score: 0.9,
        payload: {
          chatroomId: 1,
          userId: '1',
          messageId: '1',
          memoryType: 'semantic',
          chunkIndex: 0,
          chunkCount: 1,
          createdAt: '2026-04-12T00:00:00.000Z',
          sender: 'user',
          content: 'context',
        },
      },
    ]);

    await adapter.search({
      vector: [0.1, 0.2],
      limit: 5,
      minScore: 0.4,
      chatroomId: 11,
      memoryType: 'semantic',
      excludeMessageIds: ['3', '5'],
    });

    expect(mockQdrantClient.search).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        filter: {
          must: [
            { key: 'chatroomId', match: { value: 11 } },
            { key: 'memoryType', match: { value: 'semantic' } },
          ],
          must_not: [{ key: 'messageId', match: { any: ['3', '5'] } }],
        },
      }),
    );
  });

  it('checks message-level existence by payload filter and memory type', async () => {
    mockQdrantClient.scroll.mockResolvedValue({ points: [{ id: '1' }] });

    const exists = await adapter.hasPointsForMessage('42', 'semantic');

    expect(exists).toBe(true);
    expect(mockQdrantClient.scroll).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        limit: 1,
        filter: {
          must: [
            { key: 'messageId', match: { value: '42' } },
            { key: 'memoryType', match: { value: 'semantic' } },
          ],
        },
      }),
    );
  });
});
