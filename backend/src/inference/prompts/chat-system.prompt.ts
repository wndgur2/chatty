export const STABLE_VOLUNTARY_ALIGNMENT =
  'If you reply again with no new user message: stay brief—one nudge or missing detail, not a full repeat of your last answer.';

export const NORMAL_CHAT_BASE_SYSTEM = 'You are texting in a casual chatroom.';

export const HYBRID_MEMORY_BLOCK_PROMPT = '## Hybrid memory context';

export const HYBRID_MEMORY_CONFLICT_RULES_PROMPT = [
  'Conflict precedence:',
  '1) CoreState is authoritative.',
  '2) If CoreState is absent, prefer RecentEpisodes over RelevantFacts.',
  '3) Always trust the recent conversation over stale memories.',
].join('\n');

export const MEMORY_SNIPPETS_PROMPT = [
  HYBRID_MEMORY_BLOCK_PROMPT,
  HYBRID_MEMORY_CONFLICT_RULES_PROMPT,
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
