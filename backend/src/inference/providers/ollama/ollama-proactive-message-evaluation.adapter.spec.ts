import { Test, TestingModule } from '@nestjs/testing';
import {
  STRUCTURED_OUTPUT_PORT,
  StructuredOutputPort,
} from '../../shared/structured-output.port';
import { OllamaProactiveMessageEvaluationAdapter } from './ollama-proactive-message-evaluation.adapter';

describe('OllamaProactiveMessageEvaluationAdapter', () => {
  let adapter: OllamaProactiveMessageEvaluationAdapter;

  const mockStructuredOutputPort: StructuredOutputPort = {
    generate: jest.fn(),
  };

  beforeEach(async () => {
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
    (
      mockStructuredOutputPort.generate as jest.MockedFunction<
        StructuredOutputPort['generate']
      >
    ).mockResolvedValue({ decision: 'YES' });

    const result = await adapter.evaluate({
      systemPrompt: 'prompt',
    });

    expect(result).toBe('YES');
    expect(mockStructuredOutputPort.generate).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'prompt',
        schemaName: 'ProactiveDecision',
      }),
    );
  });

  it('falls back to NO when structured output fails', async () => {
    (
      mockStructuredOutputPort.generate as jest.MockedFunction<
        StructuredOutputPort['generate']
      >
    ).mockRejectedValue(new Error('fail'));

    const result = await adapter.evaluate({
      systemPrompt: 'prompt',
    });

    expect(result).toBe('NO');
  });
});
