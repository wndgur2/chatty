import { Test, TestingModule } from '@nestjs/testing';
import { ProactiveEvaluatorService } from './proactive-evaluator.service';
import {
  PROACTIVE_MESSAGE_EVALUATION_PORT,
  ProactiveMessageEvaluationPort,
} from '../ports/proactive-message-evaluation.port';

describe('ProactiveEvaluatorService', () => {
  let service: ProactiveEvaluatorService;
  const evaluateMock: jest.MockedFunction<
    ProactiveMessageEvaluationPort['evaluateShouldAnswer']
  > = jest.fn();
  const mockProactiveEvaluationPort: ProactiveMessageEvaluationPort = {
    evaluateShouldAnswer: evaluateMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProactiveEvaluatorService,
        {
          provide: PROACTIVE_MESSAGE_EVALUATION_PORT,
          useValue: mockProactiveEvaluationPort,
        },
      ],
    }).compile();

    service = module.get<ProactiveEvaluatorService>(ProactiveEvaluatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for YES decision', async () => {
    evaluateMock.mockResolvedValue('YES');

    const result = await service.shouldAnswer(
      [{ role: 'user', content: 'hello where is AI?' }],
      'You are an AI.',
      { secondsSinceLastMessage: 45, lastSender: 'user' },
    );

    expect(result).toBe(true);
    expect(evaluateMock).toHaveBeenCalledTimes(1);
    const [systemPromptArg] = evaluateMock.mock.calls[0];
    expect(systemPromptArg).toContain('You are an AI.');
    expect(systemPromptArg).toContain('USER: hello where is AI?');
  });

  it('returns false for NO decision', async () => {
    evaluateMock.mockResolvedValue('NO');

    const result = await service.shouldAnswer(
      [{ role: 'user', content: 'just chatting with a friend.' }],
      'You are an AI.',
      { secondsSinceLastMessage: 12, lastSender: 'ai' },
    );

    expect(result).toBe(false);
  });
});
