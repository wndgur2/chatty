import { Test, TestingModule } from '@nestjs/testing';
import {
  STRUCTURED_OUTPUT_PORT,
  StructuredOutputPort,
} from '../../shared/structured-output.port';
import { OllamaProactiveMessageEvaluationAdapter } from './ollama-proactive-message-evaluation.adapter';

describe('OllamaProactiveMessageEvaluationAdapter', () => {
  let adapter: OllamaProactiveMessageEvaluationAdapter;
  let generateMock: jest.MockedFunction<StructuredOutputPort['generate']>;

  beforeEach(async () => {
    generateMock = jest.fn();
    const mockStructuredOutputPort: StructuredOutputPort = {
      generate: generateMock,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OllamaProactiveMessageEvaluationAdapter,
        {
          provide: STRUCTURED_OUTPUT_PORT,
          useValue: mockStructuredOutputPort,
        },
      ],
    }).compile();

    adapter = module.get<OllamaProactiveMessageEvaluationAdapter>(
      OllamaProactiveMessageEvaluationAdapter,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns decision from structured output', async () => {
    generateMock.mockResolvedValue({ decision: 'YES' });

    const result = await adapter.evaluate({
      systemPrompt: 'prompt',
    });

    expect(result).toBe('YES');
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'prompt',
        schemaName: 'ProactiveDecision',
      }),
    );
  });

  it('falls back to NO when structured output fails', async () => {
    generateMock.mockRejectedValue(new Error('fail'));

    const result = await adapter.evaluate({
      systemPrompt: 'prompt',
    });

    expect(result).toBe('NO');
  });
});
