import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EMBEDDING_PORT } from '../../inference/ports/embedding.port';
import { VECTOR_STORE_PORT } from '../../infrastructure/vector-store/vector-store.port';
import { MemoryService } from './memory.service';

const mockEmbeddingPort = {
  embed: jest.fn(),
};

const mockVectorStorePort = {
  upsert: jest.fn(),
  search: jest.fn(),
  hasPoint: jest.fn(),
};

const mockPrismaService = {
  message: {
    findFirst: jest.fn(),
  },
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

    expect(mockEmbeddingPort.embed).not.toHaveBeenCalled();
    expect(mockVectorStorePort.upsert).not.toHaveBeenCalled();
  });

  it('is idempotent when vector point already exists', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 22n,
      sender: 'user',
      content: 'older user message',
      createdAt: new Date('2026-04-12T00:00:00.000Z'),
      chatroom: { userId: 7n },
    });
    mockVectorStorePort.hasPoint.mockResolvedValue(true);

    await service.indexOlderMessage(1);

    expect(mockEmbeddingPort.embed).not.toHaveBeenCalled();
    expect(mockVectorStorePort.upsert).not.toHaveBeenCalled();
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
