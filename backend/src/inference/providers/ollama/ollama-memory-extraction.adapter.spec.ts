import { Test, TestingModule } from '@nestjs/testing';
import { OllamaMemoryExtractionAdapter } from './ollama-memory-extraction.adapter';
import {
  STRUCTURED_OUTPUT_PORT,
  type StructuredOutputPort,
} from '../../shared/structured-output.port';

describe('OllamaMemoryExtractionAdapter', () => {
  let adapter: OllamaMemoryExtractionAdapter;
  const generateMock: jest.MockedFunction<StructuredOutputPort['generate']> =
    jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaMemoryExtractionAdapter,
        {
          provide: STRUCTURED_OUTPUT_PORT,
          useValue: {
            generate: generateMock,
          } satisfies StructuredOutputPort,
        },
      ],
    }).compile();

    adapter = module.get<OllamaMemoryExtractionAdapter>(
      OllamaMemoryExtractionAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns extracted memories from structured output', async () => {
    generateMock.mockResolvedValue({
      memories: [
        {
          kind: 'preference',
          key: 'tone',
          value: 'casual',
          confidence: 0.92,
        },
      ],
    });

    const result = await adapter.extract({
      content: 'Please keep the tone casual.',
    });

    expect(result).toEqual([
      {
        kind: 'preference',
        key: 'tone',
        value: 'casual',
        confidence: 0.92,
      },
    ]);
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        schemaName: 'ExtractedMemories',
      }),
    );
  });

  it('passes memories schema with constrained kinds', async () => {
    generateMock.mockResolvedValue({ memories: [] });

    await adapter.extract({
      content: 'I am working on the API migration project.',
      recentContext: 'assistant: what project are you on?',
    });

    const call = generateMock.mock.calls[0]?.[0];
    expect(call).toBeDefined();
    const schema = call?.schema as {
      properties?: {
        memories?: {
          items?: {
            properties?: {
              kind?: { enum?: string[] };
            };
          };
        };
      };
    };
    expect(schema.properties?.memories?.items?.properties?.kind?.enum).toEqual([
      'fact',
      'preference',
      'task',
      'project_state',
      'relationship',
      'other',
    ]);
  });
});
