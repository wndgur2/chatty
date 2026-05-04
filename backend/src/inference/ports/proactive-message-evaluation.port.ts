export const PROACTIVE_MESSAGE_EVALUATION_PORT = Symbol(
  'ProactiveMessageEvaluationPort',
);

/**
 * Produces a YES/NO decision for whether the assistant should proactively
 * send a message, given a full system prompt (including context and rules).
 */
export interface ProactiveMessageEvaluationPort {
  evaluateShouldAnswer(systemPrompt: string): Promise<'YES' | 'NO'>;
}
