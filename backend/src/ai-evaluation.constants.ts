import { CronExpression } from '@nestjs/schedule';

/** How often the background job scans for chatrooms due for AI evaluation. */
export const AI_BACKGROUND_EVALUATION_CRON = CronExpression.EVERY_5_SECONDS;

/** Seconds before the first voluntary AI evaluation after a user message. */
export const INITIAL_AI_EVALUATION_DELAY_SECONDS = 4;

/** Max consecutive voluntary AI messages (after the reply to the last user) before backoff. */
export const MAX_VOLUNTARY_MESSAGES_IN_A_ROW = 3;

/**
 * Appended to the room `basePrompt` for voluntary generations only (outer system message).
 * Kept short for small models.
 */
export const STABLE_VOLUNTARY_ALIGNMENT =
  'If you reply again with no new user message: stay brief—one nudge or missing detail, not a full repeat of your last answer.';

/**
 * Leading system text for normal (user-triggered) replies only—not used for voluntary follow-ups.
 * Nudges casual, human-like tone and shorter answers without using output token caps.
 */
export const NORMAL_CHAT_BASE_SYSTEM = 'You are texting in a casual chatroom.';

/**
 * Default decoding for normal (user-triggered) chat streaming.
 * Tune per chat model; omit fields you want left to the server default.
 */
export const DEFAULT_CHAT_OLLAMA_OPTIONS = {
  temperature: 0.8,
  repeat_penalty: 1.05,
} as const;

/**
 * Ollama decoding for voluntary follow-ups only: lower temperature, modest repeat penalty, output cap.
 * Tune per chat model if replies are too terse or still too long.
 */
export const VOLUNTARY_OLLAMA_OPTIONS = {
  /** Narrow sampling to reduce rambling on short follow-ups. */
  temperature: 0.4,
  /** Discourage looping / repeating phrasing. */
  repeat_penalty: 1.12,
  /** Tight cap for short voluntary replies (small models). */
  num_predict: 140,
} as const;

/**
 * Final history message for voluntary generations (strongest local signal). Kept short for small models.
 */
export function buildVoluntaryLastInstruction(
  lastMessageContent: string,
): string {
  const prior = lastMessageContent.trim() || '(none)';
  return [
    'Voluntary = short: max ~3 sentences or ~80 words; one paragraph; bullets only if ≤3 items.',
    'Optional nudge or one detail only—no full re-answer, greeting, recap, or summary unless the user asked.',
    'Prior (do not copy):',
    prior,
  ].join('\n');
}

/** Inputs for judging whether to send one voluntary follow-up (background evaluator). */
export type VoluntaryEvaluationContext = {
  /** Seconds since the most recent message in the thread (non-negative). */
  secondsSinceLastMessage: number;
  /** Who sent that most recent message. */
  lastSender: 'user' | 'ai';
};

/**
 * Original voluntary YES/NO evaluator system text (before natural-texting wording and time/sender context).
 * Kept for reference and comparison; {@link buildVoluntaryEvaluationPrompt} is what the app uses.
 */
export function buildLegacyVoluntaryEvaluationPrompt(
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

/** Human-readable elapsed time for the small eval model (integer units, no sub-second noise). */
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

/**
 * Full system message for the voluntary YES/NO evaluator (natural texting with AI).
 * `formattedHistory` should be lines like `USER:` / `ASSISTANT:` oldest-to-newest.
 */
export function buildVoluntaryEvaluationPrompt(
  basePrompt: string,
  formattedHistory: string,
  ctx: VoluntaryEvaluationContext,
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
