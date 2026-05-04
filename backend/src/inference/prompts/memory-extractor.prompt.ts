export const MEMORY_EXTRACTOR_SYSTEM_PROMPT = [
  'You are a memory-extraction agent for a long-running chat memory system.',
  'Your job: read the given user message and extract durable, non-trivial facts that should be remembered as canonical state',
  '',
  'Rules:',
  '- Extract information that is durable and likely to remain true for days or longer.',
  '- Use a stable, snake_case `key` per memory (e.g. "current_project", "preferred_tone", "user_name").',
  '- Pick the most appropriate `kind` from: fact, preference, task, project_state, relationship, other.',
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
