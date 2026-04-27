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
    expect(mockQdrantClient.createPayloadIndex).toHaveBeenCalledWith(
      'chat_memory',
      {
        field_name: 'messageId',
        field_schema: 'keyword',
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
          chunkIndex: 0,
          chunkCount: 1,
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

  it('derives deterministic UUIDv5-like id for upsert', async () => {
    await adapter.upsert({
      id: '481',
      vector: [0.1, 0.2],
      payload: {
        chatroomId: 1,
        userId: '1',
        messageId: '481',
        chunkIndex: 1,
        chunkCount: 3,
        createdAt: '2026-04-12T00:00:00.000Z',
        sender: 'user',
        content: 'context',
      },
    });

    expect(mockQdrantClient.upsert).toHaveBeenCalledTimes(1);
    const [, payload] = mockQdrantClient.upsert.mock.calls[0] as [
      string,
      { points: Array<{ id: string }> },
    ];
    expect(payload.points).toHaveLength(1);
    expect(payload.points[0].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  });

  it('looks up exact id for retrieve', async () => {
    mockQdrantClient.retrieve.mockResolvedValue([]);

    await adapter.hasPoint('message-482-1');

    expect(mockQdrantClient.retrieve).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        ids: ['message-482-1'],
      }),
    );
  });

  it('checks message-level existence by payload filter', async () => {
    mockQdrantClient.scroll.mockResolvedValue({ points: [{ id: '1' }] });

    const exists = await adapter.hasPointsForMessage('42');

    expect(exists).toBe(true);
    expect(mockQdrantClient.scroll).toHaveBeenCalledWith(
      'chat_memory',
      expect.objectContaining({
        limit: 1,
        filter: {
          must: [{ key: 'messageId', match: { value: '42' } }],
        },
      }),
    );
  });
});
