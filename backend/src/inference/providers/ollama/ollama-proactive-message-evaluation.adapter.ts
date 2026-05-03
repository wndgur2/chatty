import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  PROACTIVE_MESSAGE_EVALUATION_PORT,
  ProactiveMessageEvaluationPort,
  ProactiveMessageEvaluationRequest,
} from '../../ports/proactive-message-evaluation.port';
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

  async evaluate(
    req: ProactiveMessageEvaluationRequest,
  ): Promise<'YES' | 'NO'> {
    try {
      const result = await this.structuredOutputPort.generate<{
        decision: 'YES' | 'NO';
      }>({
        systemPrompt: req.systemPrompt,
        schema: PROACTIVE_DECISION_SCHEMA,
        schemaName: 'ProactiveDecision',
        signal: req.signal,
      });

      return result.decision;
    } catch (error) {
      this.logger.error('Proactive evaluation failed; fallback to NO', error);
      return 'NO';
    }
  }
}

export { PROACTIVE_DECISION_SCHEMA, PROACTIVE_MESSAGE_EVALUATION_PORT };
