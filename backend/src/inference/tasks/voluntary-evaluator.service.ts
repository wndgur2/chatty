import { Inject, Injectable } from '@nestjs/common';
import {
  CLASSIFICATION_PORT,
  type ClassificationPort,
} from '../ports/classification.port';
import { buildVoluntaryEvaluationPrompt } from '../prompts/voluntary-evaluator.prompt';
import { ChatMessage } from '../shared/chat-message';
import { VoluntaryEvaluationContext } from '../prompts/voluntary-evaluator.prompt';

@Injectable()
export class VoluntaryEvaluatorService {
  constructor(
    @Inject(CLASSIFICATION_PORT)
    private readonly classificationPort: ClassificationPort,
  ) {}

  async shouldAnswer(
    history: ChatMessage[],
    basePrompt: string,
    ctx: VoluntaryEvaluationContext,
  ): Promise<boolean> {
    const formattedHistory = history
      .slice(-10)
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n');
    const evaluationPrompt = buildVoluntaryEvaluationPrompt(
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
