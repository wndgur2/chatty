import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CoreStateValueType, Sender } from '@prisma/client';
import { MemoryService } from './memory.service';
import { SemanticMemoryService } from './semantic-memory.service';
import { EpisodicMemoryService } from './episodic-memory.service';
import { CoreStateMemoryService } from './core-state-memory.service';
import { MemoryExtractorAgentService } from './memory-extractor.agent.service';
import { MemoryRetrieverAgentService } from './memory-retriever.agent.service';

const mockSemanticMemoryService = {
  indexOlderMessage: jest.fn(),
  findMessageForExtraction: jest.fn(),
  createExtractionRun: jest.fn(),
  writeFacts: jest.fn(),
  retrieveFacts: jest.fn(),
};

const mockEpisodicMemoryService = {
  writeEpisodes: jest.fn(),
  retrieveEpisodes: jest.fn(),
};

const mockCoreStateMemoryService = {
  upsertStateUpdates: jest.fn(),
  getSnapshot: jest.fn(),
};

const mockMemoryExtractorAgentService = {
  extractFromMessage: jest.fn(),
};

const mockMemoryRetrieverAgentService = {
  rerank: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, fallback: string | number) => {
    if (key === 'MEMORY_EXTRACTOR_ENABLED') {
      return 'true';
    }
    if (key === 'MEMORY_RETRIEVER_ENABLED') {
      return 'true';
    }
    if (key === 'MEMORY_EXTRACTOR_INCLUDE_AI_TURNS') {
      return 'false';
    }
    if (key === 'MEMORY_RETRIEVER_CANDIDATE_LIMIT') {
      return 8;
    }
    if (key === 'MEMORY_RETRIEVER_FINAL_LIMIT') {
      return 5;
    }
    return fallback;
  }),
};

describe('MemoryService', () => {
  let service: MemoryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryService,
        { provide: SemanticMemoryService, useValue: mockSemanticMemoryService },
        { provide: EpisodicMemoryService, useValue: mockEpisodicMemoryService },
        {
          provide: CoreStateMemoryService,
          useValue: mockCoreStateMemoryService,
        },
        {
          provide: MemoryExtractorAgentService,
          useValue: mockMemoryExtractorAgentService,
        },
        {
          provide: MemoryRetrieverAgentService,
          useValue: mockMemoryRetrieverAgentService,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MemoryService>(MemoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('delegates older indexing to semantic layer service', async () => {
    mockSemanticMemoryService.indexOlderMessage.mockResolvedValue(undefined);

    await service.indexOlderMessage(42);

    expect(mockSemanticMemoryService.indexOlderMessage).toHaveBeenCalledWith(
      42,
    );
  });

  it('writes all extracted layers when extractor returns facts/episodes/state', async () => {
    mockSemanticMemoryService.findMessageForExtraction.mockResolvedValue({
      id: '101',
      sender: Sender.user,
      content: 'My timezone is UTC and I deployed today.',
      createdAt: '2026-05-01T00:00:00.000Z',
      chatroomId: 1,
      userId: '7',
    });
    mockMemoryExtractorAgentService.extractFromMessage.mockResolvedValue({
      model: 'gemma',
      facts: [{ content: 'User timezone is UTC.', confidence: 0.9 }],
      episodes: [
        {
          content: 'User deployed the app.',
          eventType: 'deployment',
          happenedAtIso: '2026-05-01T00:00:00.000Z',
          confidence: 0.8,
        },
      ],
      stateUpdates: [
        {
          key: 'timezone',
          operation: 'upsert',
          value: 'UTC',
          valueType: CoreStateValueType.text,
        },
      ],
    });
    mockSemanticMemoryService.createExtractionRun.mockResolvedValue({
      id: 555n,
    });

    await service.extractFromMessage('101');

    expect(mockSemanticMemoryService.createExtractionRun).toHaveBeenCalled();
    expect(mockSemanticMemoryService.writeFacts).toHaveBeenCalledWith(
      expect.objectContaining({
        extractionRunId: '555',
      }),
    );
    expect(mockEpisodicMemoryService.writeEpisodes).toHaveBeenCalledWith(
      expect.objectContaining({
        extractionRunId: '555',
      }),
    );
    expect(mockCoreStateMemoryService.upsertStateUpdates).toHaveBeenCalledWith(
      expect.objectContaining({
        extractionRunId: '555',
      }),
    );
  });

  it('applies precedence in selected context and bounds reranker result by k', async () => {
    mockSemanticMemoryService.retrieveFacts.mockResolvedValue([
      {
        id: 'semantic:old_timezone',
        type: 'semantic',
        messageId: '20',
        content: 'User timezone is PST.',
        createdAt: '2026-01-01T00:00:00.000Z',
        score: 0.7,
      },
    ]);
    mockEpisodicMemoryService.retrieveEpisodes.mockResolvedValue([
      {
        id: 'episodic:timezone_change',
        type: 'episodic',
        messageId: '21',
        content: 'User changed timezone to JST yesterday.',
        eventType: 'timezone_change',
        happenedAt: '2026-04-30T00:00:00.000Z',
        createdAt: '2026-04-30T00:00:00.000Z',
        score: 0.8,
      },
    ]);
    mockCoreStateMemoryService.getSnapshot.mockResolvedValue([
      {
        id: 'core_state:timezone',
        type: 'core_state',
        key: 'timezone',
        value: 'UTC',
        valueType: CoreStateValueType.text,
        updatedAt: '2026-05-01T00:00:00.000Z',
        expiresAt: null,
        sourceMessageId: '100',
        score: 1,
      },
    ]);
    mockMemoryRetrieverAgentService.rerank.mockResolvedValue([
      {
        id: 'core_state:timezone',
        type: 'core_state',
        key: 'timezone',
        value: 'UTC',
        valueType: CoreStateValueType.text,
        updatedAt: '2026-05-01T00:00:00.000Z',
        expiresAt: null,
        sourceMessageId: '100',
        score: 1,
        rank: 1,
        rerankScore: 0.99,
      },
      {
        id: 'episodic:timezone_change',
        type: 'episodic',
        messageId: '21',
        content: 'User changed timezone to JST yesterday.',
        eventType: 'timezone_change',
        happenedAt: '2026-04-30T00:00:00.000Z',
        createdAt: '2026-04-30T00:00:00.000Z',
        score: 0.8,
        rank: 2,
        rerankScore: 0.85,
      },
      {
        id: 'semantic:old_timezone',
        type: 'semantic',
        messageId: '20',
        content: 'User timezone is PST.',
        createdAt: '2026-01-01T00:00:00.000Z',
        score: 0.7,
        rank: 3,
        rerankScore: 0.4,
      },
    ]);

    const context = await service.retrieveContext({
      chatroomId: 1,
      query: 'what is my timezone?',
      recentMessageIds: [],
      recentConversation: [{ role: 'user', content: 'what is my timezone?' }],
      k: 2,
    });

    expect(mockMemoryRetrieverAgentService.rerank).toHaveBeenCalledWith(
      expect.objectContaining({
        finalLimit: 2,
      }),
    );
    expect(context.coreState).toHaveLength(1);
    expect(context.recentEpisodes).toHaveLength(1);
    expect(context.relevantFacts).toHaveLength(0);
    expect(context.selected.map((item) => item.id)).toEqual([
      'core_state:timezone',
      'episodic:timezone_change',
    ]);
  });
});
