/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OllamaClassificationAdapter } from './ollama-classification.adapter';
import { OLLAMA_CLIENT } from './ollama-client.provider';

describe('OllamaClassificationAdapter', () => {
  let adapter: OllamaClassificationAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaClassificationAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: string) => fallback),
          },
        },
        {
          provide: OLLAMA_CLIENT,
          useValue: {
            chat: jest.fn(),
          } as unknown as Ollama,
        },
      ],
    }).compile();

    adapter = module.get<OllamaClassificationAdapter>(
      OllamaClassificationAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns matched label from model output', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({ message: { content: 'YES' } });

    const result = await adapter.classify({
      systemPrompt: 'prompt',
      labels: ['YES', 'NO'] as const,
      fallback: 'NO',
    });

    expect(result).toBe('YES');
  });

  it('returns fallback on classification failure', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockRejectedValue(new Error('network'));

    const result = await adapter.classify({
      systemPrompt: 'prompt',
      labels: ['YES', 'NO'] as const,
      fallback: 'NO',
    });

    expect(result).toBe('NO');
  });
});
