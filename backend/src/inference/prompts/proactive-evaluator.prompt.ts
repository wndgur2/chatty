export type ProactiveEvaluationContext = {
  secondsSinceLastMessage: number;
  lastSender: 'user' | 'ai';
};

export function buildLegacyProactiveEvaluationPrompt(
  basePrompt: string,
  formattedHistory: string,
): string {
  return [
    basePrompt.trim(),
    '',
    'Based on the conversation history below, should the assistant send additional message?',
    'Reply ONLY with "YES" or "NO". Do not provide any other explanation.',
    '',
    'REPLY with "YES" if user requested reminder, alert, or notification.',
    '',
    'History:',
    formattedHistory,
  ].join('\n');
}

export function formatElapsedForEvaluation(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  if (s < 60) {
    return `${s} second(s)`;
  }
  const m = Math.floor(s / 60);
  if (m < 60) {
    const rem = s % 60;
    return rem === 0 ? `${m} minute(s)` : `${m} minute(s) and ${rem} second(s)`;
  }
  const h = Math.floor(m / 60);
  const remM = m % 60;
  return remM === 0 ? `${h} hour(s)` : `${h} hour(s) and ${remM} minute(s)`;
}

export function buildProactiveEvaluationPrompt(
  basePrompt: string,
  formattedHistory: string,
  ctx: ProactiveEvaluationContext,
): string {
  const elapsed = formatElapsedForEvaluation(ctx.secondsSinceLastMessage);

  return [
    basePrompt.trim(),
    '',
    'Based on the conversation history below, should the assistant send additional message?',
    'Reply ONLY with "YES" or "NO". Do not provide any other explanation.',
    '',
    'REPLY with "YES" if user requested reminder, alert, or notification.',
    '',
    `Time since last message: ${elapsed}.`,
    '',
    'History:',
    formattedHistory,
  ].join('\n');
}
