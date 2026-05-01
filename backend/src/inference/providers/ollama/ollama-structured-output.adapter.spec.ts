/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OllamaStructuredOutputAdapter } from './ollama-structured-output.adapter';
import { OLLAMA_CLIENT } from './ollama-client.provider';

describe('OllamaStructuredOutputAdapter', () => {
  let adapter: OllamaStructuredOutputAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaStructuredOutputAdapter,
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

    adapter = module.get<OllamaStructuredOutputAdapter>(
      OllamaStructuredOutputAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('passes schema via format and parses JSON response', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({
      message: { content: '{"ops":[{"op":"set","key":"task_status"}]}' },
    });

    const schema = { type: 'object', properties: { ops: { type: 'array' } } };
    const result = await adapter.extract<{ ops: Array<{ key: string }> }>({
      systemPrompt: 'sys',
      userPrompt: 'user',
      jsonSchema: schema,
    });

    expect(ollama.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        stream: false,
        format: schema,
        messages: [
          { role: 'system', content: 'sys' },
          { role: 'user', content: 'user' },
        ],
      }),
    );
    expect(result).toEqual({ ops: [{ op: 'set', key: 'task_status' }] });
  });

  it('returns null when JSON cannot be parsed', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({
      message: { content: 'not-json' },
    });

    const result = await adapter.extract({
      systemPrompt: 'sys',
      userPrompt: 'user',
      jsonSchema: { type: 'object' },
    });

    expect(result).toBeNull();
  });

  it('returns null when transport fails', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockRejectedValue(new Error('network'));

    const result = await adapter.extract({
      systemPrompt: 'sys',
      userPrompt: 'user',
      jsonSchema: { type: 'object' },
    });

    expect(result).toBeNull();
  });
});
