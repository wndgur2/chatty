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
            get: jest.fn((key: string, fallback: string) => fallback),
          },
        },
      ],
    }).compile();

    adapter = module.get<QdrantVectorStoreAdapter>(QdrantVectorStoreAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('creates collection and chatroom payload index when missing', async () => {
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
      {
        field_name: 'chatroomId',
        field_schema: 'integer',
      },
    );
  });

  it('builds search filters with chatroom and exclusions', async () => {
    mockQdrantClient.search.mockResolvedValue([
      {
        id: '1',
        score: 0.9,
        payload: {
          chatroomId: 1,
          userId: '1',
          messageId: '1',
          createdAt: '2026-04-12T00:00:00.000Z',
          sender: 'user',
          content: 'context',
        },
      },
    ]);

    const results = await adapter.search({
      vector: [0.1, 0.2],
      limit: 5,
      minScore: 0.4,
      chatroomId: 11,
      excludeMessageIds: ['3', '5'],
    });

    expect(results).toHaveLength(1);
    expect(mockQdrantClient.search).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        filter: {
          must: [{ key: 'chatroomId', match: { value: 11 } }],
          must_not: [{ key: 'messageId', match: { any: ['3', '5'] } }],
        },
      }),
    );
  });

  it('normalizes numeric string id for upsert', async () => {
    await adapter.upsert({
      id: '481',
      vector: [0.1, 0.2],
      payload: {
        chatroomId: 1,
        userId: '1',
        messageId: '481',
        createdAt: '2026-04-12T00:00:00.000Z',
        sender: 'user',
        content: 'context',
      },
    });

    expect(mockQdrantClient.upsert).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        points: [expect.objectContaining({ id: 481 })],
      }),
    );
  });

  it('normalizes numeric string id for retrieve', async () => {
    mockQdrantClient.retrieve.mockResolvedValue([]);

    await adapter.hasPoint('482');

    expect(mockQdrantClient.retrieve).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        ids: [482],
      }),
    );
  });
});
