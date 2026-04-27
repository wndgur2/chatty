export const STABLE_VOLUNTARY_ALIGNMENT =
  'If you reply again with no new user message: stay brief—one nudge or missing detail, not a full repeat of your last answer.';

export const NORMAL_CHAT_BASE_SYSTEM = 'You are texting in a casual chatroom.';

export const MEMORY_SNIPPETS_PROMPT = [
  '## Older user messages in this chat',
  'Treat these as background you already know, not a transcript.',
  'If they conflict with the recent conversation, trust the recent conversation. Snippets may be truncated, so do not invent details beyond what is shown.',
].join('\n');

export function buildProactiveLastInstruction(
  lastMessageContent: string,
): string {
  const prior = lastMessageContent.trim() || '(none)';
  return [
    'Proactive = short: max ~3 sentences or ~80 words; one paragraph; bullets only if ≤3 items.',
    'Optional nudge or one detail only—no full re-answer, greeting, recap, or summary unless the user asked.',
    'Prior (do not copy):',
    prior,
  ].join('\n');
}
