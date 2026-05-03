import { MemoryKind } from '../ports/memory-extraction.port';

export function buildMemoryExtractorPrompt(
  content: string,
  recentContext?: string,
): string {
  const contextBlock = recentContext?.trim()
    ? [
        '',
        'Recent context for disambiguation (do not extract transient chatter):',
        recentContext.trim(),
      ].join('\n')
    : '';

  return [
    'Extract durable user/project state from a single older user message.',
    'Return only memories that are likely to stay useful across future turns.',
    'Do not include small talk, one-off greetings, or obvious restatements.',
    'Use concise canonical keys in snake_case and plain text values.',
    'Confidence must be between 0 and 1.',
    '',
    `Allowed kinds: ${MEMORY_KIND_LIST.join(', ')}.`,
    '',
    'User message:',
    content.trim(),
    contextBlock,
  ].join('\n');
}

const MEMORY_KIND_LIST: MemoryKind[] = [
  'fact',
  'preference',
  'task',
  'project_state',
  'relationship',
  'other',
];
