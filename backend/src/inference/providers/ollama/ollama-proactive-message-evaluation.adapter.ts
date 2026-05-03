import { Inject, Injectable, Logger } from '@nestjs/common';
import { ProactiveMessageEvaluationPort } from '../../ports/proactive-message-evaluation.port';
import {
  STRUCTURED_OUTPUT_PORT,
  type StructuredOutputPort,
} from '../../shared/structured-output.port';

const PROACTIVE_DECISION_SCHEMA = {
  type: 'object',
  properties: {
    decision: {
      type: 'string',
      enum: ['YES', 'NO'],
    },
  },
  required: ['decision'],
  additionalProperties: false,
} as const;

@Injectable()
export class OllamaProactiveMessageEvaluationAdapter implements ProactiveMessageEvaluationPort {
  private readonly logger = new Logger(
    OllamaProactiveMessageEvaluationAdapter.name,
  );

  constructor(
    @Inject(STRUCTURED_OUTPUT_PORT)
    private readonly structuredOutputPort: StructuredOutputPort,
  ) {}

  async evaluateShouldAnswer(systemPrompt: string): Promise<'YES' | 'NO'> {
    try {
      const { decision } = await this.structuredOutputPort.generate<{
        decision: 'YES' | 'NO';
      }>({
        systemPrompt,
        schema: PROACTIVE_DECISION_SCHEMA as unknown as Record<string, unknown>,
        schemaName: 'ProactiveDecision',
      });
      return decision === 'YES' ? 'YES' : 'NO';
    } catch (e) {
      this.logger.error('Proactive message evaluation failed', e);
      return 'NO';
    }
  }
}
