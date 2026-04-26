import { Test, TestingModule } from '@nestjs/testing';
import { ProactiveEvaluatorService } from './proactive-evaluator.service';
import {
  CLASSIFICATION_PORT,
  ClassificationPort,
} from '../ports/classification.port';

describe('ProactiveEvaluatorService', () => {
  let service: ProactiveEvaluatorService;
  const classifyMock: jest.MockedFunction<ClassificationPort['classify']> =
    jest.fn();
  const mockClassificationPort: ClassificationPort = {
    classify: classifyMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProactiveEvaluatorService,
        { provide: CLASSIFICATION_PORT, useValue: mockClassificationPort },
      ],
    }).compile();

    service = module.get<ProactiveEvaluatorService>(ProactiveEvaluatorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns true for YES classification', async () => {
    classifyMock.mockResolvedValue('YES');

    const result = await service.shouldAnswer(
      [{ role: 'user', content: 'hello where is AI?' }],
      'You are an AI.',
      { secondsSinceLastMessage: 45, lastSender: 'user' },
    );

    expect(result).toBe(true);
    expect(classifyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        labels: ['YES', 'NO'],
        fallback: 'NO',
      }),
    );
  });

  it('returns false for NO classification', async () => {
    classifyMock.mockResolvedValue('NO');

    const result = await service.shouldAnswer(
      [{ role: 'user', content: 'just chatting with a friend.' }],
      'You are an AI.',
      { secondsSinceLastMessage: 12, lastSender: 'ai' },
    );

    expect(result).toBe(false);
  });
});
