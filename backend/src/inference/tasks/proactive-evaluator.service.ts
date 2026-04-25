import { Inject, Injectable } from '@nestjs/common';
import {
  CLASSIFICATION_PORT,
  type ClassificationPort,
} from '../ports/classification.port';
import { buildProactiveEvaluationPrompt } from '../prompts/proactive-evaluator.prompt';
import { ChatMessage } from '../shared/chat-message';
import { ProactiveEvaluationContext } from '../prompts/proactive-evaluator.prompt';

@Injectable()
export class ProactiveEvaluatorService {
  constructor(
    @Inject(CLASSIFICATION_PORT)
    private readonly classificationPort: ClassificationPort,
  ) {}

  async shouldAnswer(
    history: ChatMessage[],
    basePrompt: string,
    ctx: ProactiveEvaluationContext,
  ): Promise<boolean> {
    const formattedHistory = history
      .slice(-10)
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');
    const evaluationPrompt = buildProactiveEvaluationPrompt(
      basePrompt,
      formattedHistory,
      ctx,
    );

    const result = await this.classificationPort.classify({
      systemPrompt: evaluationPrompt,
      labels: ['YES', 'NO'] as const,
      fallback: 'NO',
    });
    return result === 'YES';
  }
}
