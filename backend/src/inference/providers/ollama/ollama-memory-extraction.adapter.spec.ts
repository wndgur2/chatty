import { Test, TestingModule } from '@nestjs/testing';
import { OllamaMemoryExtractionAdapter } from './ollama-memory-extraction.adapter';
import {
  STRUCTURED_OUTPUT_PORT,
  StructuredOutputPort,
} from '../../shared/structured-output.port';

describe('OllamaMemoryExtractionAdapter', () => {
  let adapter: OllamaMemoryExtractionAdapter;
  const generateMock: jest.MockedFunction<StructuredOutputPort['generate']> =
    jest.fn();
  const mockStructuredOutputPort: StructuredOutputPort = {
    generate: generateMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaMemoryExtractionAdapter,
        {
          provide: STRUCTURED_OUTPUT_PORT,
          useValue: mockStructuredOutputPort,
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

  it('passes a memories[] schema to the structured output port', async () => {
    generateMock.mockResolvedValue({ memories: [] });

    await adapter.extract({ content: 'older user message' });

    const callArg = generateMock.mock.calls[0][0];
    expect(callArg.schemaName).toBe('MemoryExtraction');
    const schema = callArg.schema as { properties: { memories: unknown } };
    expect(schema.properties.memories).toBeDefined();
  });

  it('returns normalized extracted memories', async () => {
    generateMock.mockResolvedValue({
      memories: [
        {
          kind: 'preference',
          key: '  preferred_tone  ',
          value: '  casual  ',
          confidence: 0.9,
        },
        {
          kind: 'project_state',
          key: 'current_project',
          value: 'Chatty backend refactor',
          confidence: 1.5,
        },
      ],
    });

    const result = await adapter.extract({ content: 'msg' });

    expect(result).toEqual([
      {
        kind: 'preference',
        key: 'preferred_tone',
        value: 'casual',
        confidence: 0.9,
      },
      {
        kind: 'project_state',
        key: 'current_project',
        value: 'Chatty backend refactor',
        confidence: 1,
      },
    ]);
  });

  it('drops memories with invalid kind, missing key, or empty value', async () => {
    generateMock.mockResolvedValue({
      memories: [
        { kind: 'unknown', key: 'k', value: 'v', confidence: 0.9 },
        { kind: 'fact', key: '', value: 'v', confidence: 0.9 },
        { kind: 'fact', key: 'k', value: '   ', confidence: 0.9 },
        { kind: 'fact', key: 'good', value: 'kept', confidence: 0.7 },
      ],
    });

    const result = await adapter.extract({ content: 'msg' });

    expect(result).toEqual([
      { kind: 'fact', key: 'good', value: 'kept', confidence: 0.7 },
    ]);
  });

  it('returns [] on structured output failure', async () => {
    generateMock.mockRejectedValue(new Error('boom'));

    const result = await adapter.extract({ content: 'msg' });

    expect(result).toEqual([]);
  });

  it('returns [] when memories is not an array', async () => {
    generateMock.mockResolvedValue({} as { memories: never[] });

    const result = await adapter.extract({ content: 'msg' });

    expect(result).toEqual([]);
  });

  it('passes recentContext into the user prompt when present', async () => {
    generateMock.mockResolvedValue({ memories: [] });

    await adapter.extract({
      content: 'older message',
      recentContext: 'USER: hi\nAI: hello',
    });

    const callArg = generateMock.mock.calls[0][0];
    expect(callArg.userPrompt).toContain('older message');
    expect(callArg.userPrompt).toContain('USER: hi');
  });
});
