import { Inject, Injectable } from '@nestjs/common';
import {
  PROACTIVE_MESSAGE_EVALUATION_PORT,
  type ProactiveMessageEvaluationPort,
} from '../ports/proactive-message-evaluation.port';
import { buildProactiveEvaluationPrompt } from '../prompts/proactive-evaluator.prompt';
import { ChatMessage } from '../shared/chat-message';
import { ProactiveEvaluationContext } from '../prompts/proactive-evaluator.prompt';

@Injectable()
export class ProactiveEvaluatorService {
  constructor(
    @Inject(PROACTIVE_MESSAGE_EVALUATION_PORT)
    private readonly proactiveMessageEvaluationPort: ProactiveMessageEvaluationPort,
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

    const result = await this.proactiveMessageEvaluationPort.evaluate({
      systemPrompt: evaluationPrompt,
    });
    return result === 'YES';
  }
}
