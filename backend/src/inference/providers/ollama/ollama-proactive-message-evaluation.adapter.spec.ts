/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { OllamaProactiveMessageEvaluationAdapter } from './ollama-proactive-message-evaluation.adapter';
import {
  STRUCTURED_OUTPUT_PORT,
  StructuredOutputPort,
} from '../../shared/structured-output.port';

describe('OllamaProactiveMessageEvaluationAdapter', () => {
  let adapter: OllamaProactiveMessageEvaluationAdapter;
  const generateMock: jest.MockedFunction<StructuredOutputPort['generate']> =
    jest.fn();
  const mockStructuredOutputPort: StructuredOutputPort = {
    generate: generateMock,
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

  it('returns YES when the structured output decision is YES', async () => {
    generateMock.mockResolvedValue({ decision: 'YES' });

    const result = await adapter.evaluateShouldAnswer('prompt');

    expect(result).toBe('YES');
    expect(generateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPrompt: 'prompt',
        schemaName: 'ProactiveDecision',
        schema: expect.objectContaining({
          type: 'object',
          properties: expect.objectContaining({
            decision: expect.objectContaining({
              enum: ['YES', 'NO'],
            }),
          }),
        }),
      }),
    );
  });

  it('returns NO when the structured output decision is NO', async () => {
    generateMock.mockResolvedValue({ decision: 'NO' });

    const result = await adapter.evaluateShouldAnswer('prompt');

    expect(result).toBe('NO');
  });

  it('falls back to NO on structured output failure', async () => {
    generateMock.mockRejectedValue(new Error('boom'));

    const result = await adapter.evaluateShouldAnswer('prompt');

    expect(result).toBe('NO');
  });

  it('coerces unexpected decision values to NO', async () => {
    generateMock.mockResolvedValue({ decision: 'maybe' as 'YES' | 'NO' });

    const result = await adapter.evaluateShouldAnswer('prompt');

    expect(result).toBe('NO');
  });
});
