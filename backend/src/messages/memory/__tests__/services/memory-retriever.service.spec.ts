import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemoryRetrieverService } from '../../services/memory-retriever.service';
import { MemoryService } from '../../services/memory.service';
import { PrismaService } from '../../../../prisma/prisma.service';

const mockPrismaService = {
  memory: {
    findMany: jest.fn(),
  },
};
const mockMemoryService = {
  retrieveContext: jest.fn(),
};
const mockConfigService = {
  get: jest.fn((key: string, fallback: number) => fallback),
};

describe('MemoryRetrieverService', () => {
  let service: MemoryRetrieverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryRetrieverService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: MemoryService, useValue: mockMemoryService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MemoryRetrieverService>(MemoryRetrieverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('merges canonical memories from MySQL and snippets from MemoryService', async () => {
    mockPrismaService.memory.findMany.mockResolvedValue([
      { kind: 'preference', key: 'preferred_tone', value: 'casual' },
      {
        kind: 'project_state',
        key: 'current_project',
        value: 'Chatty backend refactor',
      },
    ]);
    const snippets = [
      {
        messageId: '7',
        content: 'older content',
        createdAt: '2026-04-12T00:00:00.000Z',
        score: 0.91,
      },
    ];
    mockMemoryService.retrieveContext.mockResolvedValue(snippets);

    const result = await service.retrieve(1, 'remind me about deploys', {
      k: 5,
      recentMessageIds: ['100'],
    });

    expect(mockPrismaService.memory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { chatroomId: 1n, supersededAt: null },
        take: 20,
      }),
    );
    expect(mockMemoryService.retrieveContext).toHaveBeenCalledWith(
      1,
      'remind me about deploys',
      { k: 5, recentMessageIds: ['100'] },
    );
    expect(result.canonical).toEqual([
      { kind: 'preference', key: 'preferred_tone', value: 'casual' },
      {
        kind: 'project_state',
        key: 'current_project',
        value: 'Chatty backend refactor',
      },
    ]);
    expect(result.snippets).toBe(snippets);
  });

  it('returns empty arrays when nothing is found', async () => {
    mockPrismaService.memory.findMany.mockResolvedValue([]);
    mockMemoryService.retrieveContext.mockResolvedValue([]);

    const result = await service.retrieve(1, '', {
      k: 5,
      recentMessageIds: [],
    });

    expect(result).toEqual({ canonical: [], snippets: [] });
  });
});
