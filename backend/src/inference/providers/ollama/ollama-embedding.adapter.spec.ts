/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OllamaEmbeddingAdapter } from './ollama-embedding.adapter';
import { OLLAMA_CLIENT } from './ollama-client.provider';

describe('OllamaEmbeddingAdapter', () => {
  let adapter: OllamaEmbeddingAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaEmbeddingAdapter,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: string) => fallback),
          },
        },
        {
          provide: OLLAMA_CLIENT,
          useValue: {
            embed: jest.fn(),
          } as unknown as Ollama,
        },
      ],
    }).compile();

    adapter = module.get<OllamaEmbeddingAdapter>(OllamaEmbeddingAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('embeds a single text input', async () => {
    const ollama = (adapter as any).ollama as { embed: jest.Mock };
    ollama.embed.mockResolvedValue({
      embeddings: [[0.1, 0.2, 0.3]],
    });

    const embedding = await adapter.embed('hello');

    expect(embedding).toEqual([0.1, 0.2, 0.3]);
    expect(ollama.embed).toHaveBeenCalledWith({
      model: 'all-minilm',
      input: 'hello',
    });
  });

  it('embeds batch inputs', async () => {
    const ollama = (adapter as any).ollama as { embed: jest.Mock };
    ollama.embed.mockResolvedValue({
      embeddings: [
        [0.1, 0.2],
        [0.4, 0.5],
      ],
    });

    const embeddings = await adapter.embedBatch(['a', 'b']);

    expect(embeddings).toEqual([
      [0.1, 0.2],
      [0.4, 0.5],
    ]);
  });
});
