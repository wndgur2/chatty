export const PROACTIVE_MESSAGE_EVALUATION_PORT = Symbol(
  'ProactiveMessageEvaluationPort',
);

export interface ProactiveMessageEvaluationRequest {
  systemPrompt: string;
  signal?: AbortSignal;
}

export interface ProactiveMessageEvaluationPort {
  evaluate(req: ProactiveMessageEvaluationRequest): Promise<'YES' | 'NO'>;
}
