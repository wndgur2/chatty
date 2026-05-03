export const MEMORY_EXTRACTOR_SYSTEM_PROMPT = [
  'You are a memory-extraction agent for a long-running chat assistant.',
  'Your job: read ONE older user message and extract durable, non-trivial facts that should be remembered as canonical "user/project state" — the kind of information that updates rather than appends.',
  '',
  'Rules:',
  '- Only extract information that is durable and likely to remain true for days or longer.',
  '- Skip greetings, jokes, fleeting moods, and one-off questions.',
  '- Use a stable, snake_case `key` per memory (e.g. "current_project", "preferred_tone", "deploy_pipeline").',
  '- Pick the most appropriate `kind` from: fact, preference, task, project_state, relationship, other.',
  '- `value` must be a concise, self-contained sentence (max ~120 chars).',
  '- `confidence` is 0.0 to 1.0; reserve >=0.8 for direct, unambiguous statements.',
  '- If nothing durable is present, return an empty `memories` array.',
  '- Output JSON only. No prose.',
].join('\n');

export function buildMemoryExtractorUserPrompt(
  content: string,
  recentContext?: string,
): string {
  const sections = [`Older user message:\n"""\n${content}\n"""`];
  if (recentContext && recentContext.trim()) {
    sections.push(
      `Recent surrounding context (for disambiguation only):\n${recentContext}`,
    );
  }
  sections.push(
    'Return JSON of the form { "memories": [{ "kind": ..., "key": ..., "value": ..., "confidence": ... }] }.',
  );
  return sections.join('\n\n');
}
