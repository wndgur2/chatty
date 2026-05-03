import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { EMBEDDING_PORT } from '../../../../inference/ports/embedding.port';
import { VECTOR_STORE_PORT } from '../../../../infrastructure/vector-store/vector-store.port';
import { MemoryService } from '../../services/memory.service';
import { SemanticChunkerService } from '../../services/semantic-chunker.service';

const mockEmbeddingPort = {
  embed: jest.fn(),
};

const mockVectorStorePort = {
  upsert: jest.fn(),
  search: jest.fn(),
  hasPointsForMessage: jest.fn(),
};

const mockSemanticChunkerService = {
  chunk: jest.fn(),
};

const mockPrismaService = {
  message: {
    findFirst: jest.fn(),
  },
};

type UpsertPayload = {
  messageId: string;
  chunkIndex: number;
  chunkCount: number;
  content: string;
};

type UpsertRequest = {
  id: string;
  payload: UpsertPayload;
};

describe('MemoryService', () => {
  let service: MemoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: EMBEDDING_PORT, useValue: mockEmbeddingPort },
        { provide: VECTOR_STORE_PORT, useValue: mockVectorStorePort },
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: SemanticChunkerService,
          useValue: mockSemanticChunkerService,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: number) => fallback),
          },
        },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('skips indexing when target older message is not from user', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 21n,
      sender: 'ai',
      content: 'ai note',
      createdAt: new Date(),
      chatroom: { userId: 1n },
    });

    await service.indexOlderMessage(1);

    expect(mockSemanticChunkerService.chunk).not.toHaveBeenCalled();
    expect(mockVectorStorePort.upsert).not.toHaveBeenCalled();
  });

  it('is idempotent when vectors for message already exist', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 22n,
      sender: 'user',
      content: 'older user message',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      chatroom: { userId: 7n },
    });
    mockVectorStorePort.hasPointsForMessage.mockResolvedValue(true);

    await service.indexOlderMessage(1);

    expect(mockSemanticChunkerService.chunk).not.toHaveBeenCalled();
    expect(mockVectorStorePort.upsert).not.toHaveBeenCalled();
  });

  it('upserts all semantic chunks for a message', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 23n,
      sender: 'user',
      content: 'very long message',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      chatroom: { userId: 7n },
    });
    mockVectorStorePort.hasPointsForMessage.mockResolvedValue(false);
    mockSemanticChunkerService.chunk.mockResolvedValue([
      { text: 'chunk one', embedding: [0.1, 0.2] },
      { text: 'chunk two', embedding: [0.3, 0.4] },
    ]);

    await service.indexOlderMessage(1);

    expect(mockVectorStorePort.upsert).toHaveBeenCalledTimes(2);
    const [firstUpsertArg, secondUpsertArg] = mockVectorStorePort.upsert.mock
      .calls as [Array<UpsertRequest>, Array<UpsertRequest>];

    expect(firstUpsertArg[0]).toMatchObject({
      id: '23#0',
      payload: {
        messageId: '23',
        chunkIndex: 0,
        chunkCount: 2,
        content: 'chunk one',
      },
    });
    expect(secondUpsertArg[0]).toMatchObject({
      id: '23#1',
      payload: {
        messageId: '23',
        chunkIndex: 1,
        chunkCount: 2,
        content: 'chunk two',
      },
    });
  });

  it('retrieves and truncates memory snippets with score filtering handled by vector store', async () => {
    mockEmbeddingPort.embed.mockResolvedValue([0.1, 0.2]);
    mockVectorStorePort.search.mockResolvedValue([
      {
        id: '1',
        score: 0.91,
        payload: {
          chatroomId: 1,
          userId: '1',
          messageId: '1',
          chunkIndex: 0,
          chunkCount: 1,
          createdAt: '2026-04-12T00:00:00.000Z',
          sender: 'user',
          content: 'x'.repeat(260),
        },
      },
      {
        id: '2',
        score: 0.83,
        payload: {
          chatroomId: 1,
          userId: '1',
          messageId: '2',
          chunkIndex: 0,
          chunkCount: 1,
          createdAt: '2026-04-13T00:00:00.000Z',
          sender: 'user',
          content: 'short text',
        },
      },
    ]);

    const snippets = await service.retrieveContext(1, 'migration notes', {
      k: 5,
      recentMessageIds: ['9', '10'],
    });

    expect(mockVectorStorePort.search).toHaveBeenCalledWith({
      vector: [0.1, 0.2],
      limit: 5,
      minScore: 0.4,
      chatroomId: 1,
      excludeMessageIds: ['9', '10'],
    });
    expect(snippets).toHaveLength(2);
    expect(snippets[0].content.length).toBeLessThanOrEqual(200);
  });
});
