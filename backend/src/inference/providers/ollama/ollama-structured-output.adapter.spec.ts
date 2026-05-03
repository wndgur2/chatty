/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OllamaStructuredOutputAdapter } from './ollama-structured-output.adapter';
import { OLLAMA_CLIENT } from './ollama-client.provider';
import { StructuredOutputError } from '../../shared/structured-output.port';

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

  it('passes the JSON schema as `format` and parses the response body', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({
      message: { content: '{"decision":"YES"}' },
    });
    const schema = {
      type: 'object',
      properties: { decision: { type: 'string' } },
      required: ['decision'],
    };

    const result = await adapter.generate<{ decision: string }>({
      systemPrompt: 'sys',
      userPrompt: 'user',
      schema,
      schemaName: 'Decision',
    });

    expect(result).toEqual({ decision: 'YES' });
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
  });

  it('omits user message when no userPrompt is provided', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({ message: { content: '{}' } });

    await adapter.generate({ systemPrompt: 'sys-only', schema: {} });

    const call = ollama.chat.mock.calls[0][0] as { messages: unknown[] };
    expect(call.messages).toEqual([{ role: 'system', content: 'sys-only' }]);
  });

  it('throws StructuredOutputError on transport failure', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockRejectedValue(new Error('network'));

    await expect(
      adapter.generate({ systemPrompt: 'sys', schema: {} }),
    ).rejects.toBeInstanceOf(StructuredOutputError);
  });

  it('throws StructuredOutputError on invalid JSON', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({ message: { content: 'not-json' } });

    await expect(
      adapter.generate({ systemPrompt: 'sys', schema: {} }),
    ).rejects.toBeInstanceOf(StructuredOutputError);
  });

  it('throws StructuredOutputError on empty body', async () => {
    const ollama = (adapter as any).ollama as { chat: jest.Mock };
    ollama.chat.mockResolvedValue({ message: { content: '' } });

    await expect(
      adapter.generate({ systemPrompt: 'sys', schema: {} }),
    ).rejects.toBeInstanceOf(StructuredOutputError);
  });
});
