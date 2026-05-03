import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryService } from './memory.service';
import { MemoryRetrieverService } from './memory-retriever.service';

describe('MemoryRetrieverService', () => {
  let service: MemoryRetrieverService;

  const mockPrisma = {
    memory: {
      findMany: jest.fn(),
    },
  };

  const mockMemoryService = {
    retrieveContext: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryRetrieverService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: MemoryService, useValue: mockMemoryService },
      ],
    }).compile();

    service = module.get<MemoryRetrieverService>(MemoryRetrieverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns canonical memories and snippets in merged shape', async () => {
    mockPrisma.memory.findMany.mockResolvedValue([
      {
        kind: 'preference',
        key: 'tone',
        value: 'casual',
      },
    ]);
    mockMemoryService.retrieveContext.mockResolvedValue([
      {
        messageId: '7',
        content: 'snippet',
        createdAt: '2026-04-13T00:00:00.000Z',
        score: 0.8,
      },
    ]);

    const result = await service.retrieve(1, 'hello', {
      k: 5,
      recentMessageIds: ['10'],
    });

    expect(result.canonical).toHaveLength(1);
    expect(result.snippets).toHaveLength(1);
    expect(mockMemoryService.retrieveContext).toHaveBeenCalledWith(1, 'hello', {
      k: 5,
      recentMessageIds: ['10'],
    });
    expect(mockPrisma.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          chatroomId: 1n,
          supersededAt: null,
        },
      }),
    );
  });
});
