import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CHAT_COMPLETION_PORT } from '../../inference/ports/chat-completion.port';
import { CLASSIFICATION_PORT } from '../../inference/ports/classification.port';
import { MemoryExtractorAgentService } from './memory-extractor.agent.service';

const mockChatCompletionPort = {
  stream: jest.fn(),
};

const mockClassificationPort = {
  classify: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((key: string, fallback: string) => {
    if (key === 'MEMORY_EXTRACTOR_ENABLED') {
      return 'true';
    }
    if (key === 'OLLAMA_EVAL_MODEL') {
      return 'gemma-test';
    }
    return fallback;
  }),
};

async function* collectIteratorChunks(
  chunks: string[],
): AsyncIterable<{ delta: string }> {
  for (const chunk of chunks) {
    yield { delta: chunk };
    await Promise.resolve();
  }
}

describe('MemoryExtractorAgentService', () => {
  let service: MemoryExtractorAgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryExtractorAgentService,
        { provide: CHAT_COMPLETION_PORT, useValue: mockChatCompletionPort },
        { provide: CLASSIFICATION_PORT, useValue: mockClassificationPort },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MemoryExtractorAgentService>(
      MemoryExtractorAgentService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty extraction when classifier says IGNORE', async () => {
    mockClassificationPort.classify.mockResolvedValue('IGNORE');

    const result = await service.extractFromMessage({
      id: '10',
      sender: 'user',
      content: 'hello there',
      createdAt: '2026-05-01T00:00:00.000Z',
      chatroomId: 1,
      userId: '2',
    });

    expect(result.facts).toEqual([]);
    expect(result.episodes).toEqual([]);
    expect(result.stateUpdates).toEqual([]);
    expect(mockChatCompletionPort.stream).not.toHaveBeenCalled();
  });

  it('parses facts, episodes, and state updates from extractor JSON', async () => {
    mockClassificationPort.classify.mockResolvedValue('EXTRACT');
    mockChatCompletionPort.stream.mockReturnValue(
      collectIteratorChunks([
        JSON.stringify({
          facts: [{ content: 'User timezone is UTC.', confidence: 0.9 }],
          episodes: [
            {
              content: 'User deployed app to staging.',
              eventType: 'deployment',
              happenedAtIso: '2026-05-01T12:00:00.000Z',
            },
          ],
          stateUpdates: [
            {
              key: 'timezone',
              operation: 'upsert',
              value: 'UTC',
              valueType: 'text',
              ttlSeconds: 3600,
            },
          ],
        }),
      ]),
    );

    const result = await service.extractFromMessage({
      id: '11',
      sender: 'user',
      content: 'I am in UTC and deployed to staging.',
      createdAt: '2026-05-01T00:00:00.000Z',
      chatroomId: 1,
      userId: '2',
    });

    expect(result.model).toBe('gemma-test');
    expect(result.facts).toHaveLength(1);
    expect(result.episodes).toHaveLength(1);
    expect(result.stateUpdates).toHaveLength(1);
    expect(result.stateUpdates[0].key).toBe('timezone');
  });
});
