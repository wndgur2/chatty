/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OllamaStructuredOutputAdapter } from './ollama-structured-output.adapter';
import { OLLAMA_CLIENT } from './ollama-client.provider';
import { StructuredOutputError } from '../../shared/structured-output.error';

describe('OllamaStructuredOutputAdapter', () => {
  let adapter: OllamaStructuredOutputAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaStructuredOutputAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((_: string, fallback: string) => fallback),
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

    adapter = module.get<OllamaStructuredOutputAdapter>(
      OllamaStructuredOutputAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes schema as ollama format and parses JSON output', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({
      message: {
        content: JSON.stringify({ decision: 'YES' }),
      },
    });
    const schema = {
      type: 'object',
      properties: {
        decision: { type: 'string', enum: ['YES', 'NO'] },
      },
      required: ['decision'],
      additionalProperties: false,
    };

    const result = await adapter.generate<{ decision: 'YES' | 'NO' }>({
      systemPrompt: 'system',
      userPrompt: 'user',
      schema,
      decoding: { temperature: 0.2 },
    });

    expect(result).toEqual({ decision: 'YES' });
    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        format: schema,
        options: { temperature: 0.2 },
      }),
    );
  });

  it('throws StructuredOutputError for invalid JSON content', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({
      message: { content: 'not-json' },
    });

    await expect(
      adapter.generate({
        systemPrompt: 'system',
        schema: { type: 'object' },
      }),
    ).rejects.toBeInstanceOf(StructuredOutputError);
  });
});
