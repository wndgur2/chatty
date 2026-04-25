/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OllamaChatCompletionAdapter } from './ollama-chat-completion.adapter';
import { OLLAMA_CLIENT } from './ollama-client.provider';

describe('OllamaChatCompletionAdapter', () => {
  let adapter: OllamaChatCompletionAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaChatCompletionAdapter,
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

    adapter = module.get<OllamaChatCompletionAdapter>(
      OllamaChatCompletionAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('streams deltas from ollama responses', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    function* stream() {
      yield { message: { content: 'hel' } };
      yield { message: { content: 'lo' } };
      yield { message: {} };
    }
    ollama.chat.mockResolvedValue(stream());

    const chunks: string[] = [];
    for await (const chunk of adapter.stream({
      messages: [{ role: 'user', content: 'hi' }],
      systemPrompt: 'sys',
    })) {
      chunks.push(chunk.delta);
    }

    expect(chunks).toEqual(['hel', 'lo', '']);
    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'hi' },
        ],
        stream: true,
      }),
    );
  });
});
