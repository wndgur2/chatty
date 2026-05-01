import { Test, TestingModule } from '@nestjs/testing';
import { CHAT_COMPLETION_PORT } from '../../inference/ports/chat-completion.port';
import { MemoryRetrieverAgentService } from './memory-retriever.agent.service';

const collectSingleChunk = (text: string) =>
  (async function* () {
    await Promise.resolve();
    yield { delta: text };
  })();

const mockChatCompletionPort = {
  stream: jest.fn(),
};

describe('MemoryRetrieverAgentService', () => {
  let service: MemoryRetrieverAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryRetrieverAgentService,
        { provide: CHAT_COMPLETION_PORT, useValue: mockChatCompletionPort },
      ],
    }).compile();

    service = module.get<MemoryRetrieverAgentService>(
      MemoryRetrieverAgentService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('bounds output to finalLimit and keeps rerank order', async () => {
    mockChatCompletionPort.stream.mockReturnValue(
      collectSingleChunk(
        JSON.stringify({
          selected: [
            {
              memoryId: 'core_state:timezone',
              score: 0.99,
              reason: 'latest state',
            },
            { memoryId: 'episodic:travel', score: 0.8, reason: 'recent event' },
            { memoryId: 'semantic:old', score: 0.2, reason: 'background' },
          ],
        }),
      ),
    );

    const selected = await service.rerank({
      query: 'Where am I now?',
      recentConversation: [{ role: 'user', content: 'I landed in Tokyo.' }],
      candidates: [
        {
          id: 'core_state:timezone',
          type: 'core_state',
          key: 'timezone',
          value: 'JST',
          valueType: 'text',
          updatedAt: '2026-05-01T00:00:00.000Z',
          expiresAt: null,
          sourceMessageId: '10',
          score: 1,
        },
        {
          id: 'episodic:travel',
          type: 'episodic',
          messageId: '11',
          content: 'User arrived in Tokyo today.',
          eventType: 'travel',
          happenedAt: '2026-05-01T00:00:00.000Z',
          createdAt: '2026-05-01T00:00:00.000Z',
          score: 0.9,
        },
        {
          id: 'semantic:old',
          type: 'semantic',
          messageId: '12',
          content: 'User once visited Osaka.',
          createdAt: '2026-02-01T00:00:00.000Z',
          score: 0.4,
        },
      ],
      candidateLimit: 3,
      finalLimit: 2,
      tokenBudget: 100,
    });

    expect(selected).toHaveLength(2);
    expect(selected.map((item) => item.id)).toEqual([
      'core_state:timezone',
      'episodic:travel',
    ]);
  });

  it('falls back to precedence heuristic when rerank output is invalid', async () => {
    mockChatCompletionPort.stream.mockReturnValue(
      collectSingleChunk('not json'),
    );

    const selected = await service.rerank({
      query: 'timezone?',
      recentConversation: [],
      candidates: [
        {
          id: 'semantic:old',
          type: 'semantic',
          messageId: '12',
          content: 'User timezone was PST.',
          createdAt: '2026-02-01T00:00:00.000Z',
          score: 0.8,
        },
        {
          id: 'core_state:timezone',
          type: 'core_state',
          key: 'timezone',
          value: 'UTC',
          valueType: 'text',
          updatedAt: '2026-05-01T00:00:00.000Z',
          expiresAt: null,
          sourceMessageId: '10',
          score: 1,
        },
      ],
      candidateLimit: 5,
      finalLimit: 1,
    });

    expect(selected).toHaveLength(1);
    expect(selected[0].id).toBe('core_state:timezone');
    expect(selected[0].reason).toBe('heuristic fallback');
  });
});
