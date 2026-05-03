import { MEMORY_SNIPPETS_PROMPT } from '../../inference/prompts/chat-system.prompt';
import { MemoryKind } from '@prisma/client';

export type MemorySnippet = {
  messageId: string;
  content: string;
  createdAt: string;
  score: number;
};

export function formatMemorySnippets(snippets: MemorySnippet[]): string {
  if (snippets.length === 0) {
    return '';
  }

  const lines = snippets.map((snippet) => {
    const date = snippet.createdAt.slice(0, 10);
    return `- (${date}) "${snippet.content}"`;
  });

  return `${MEMORY_SNIPPETS_PROMPT}\n\n${lines.join('\n')}`;
}

type CanonicalMemoryRow = {
  kind: MemoryKind;
  key: string;
  value: string;
};

const MEMORY_KIND_ORDER: MemoryKind[] = [
  'fact',
  'preference',
  'task',
  'project_state',
  'relationship',
  'other',
];

export function formatCanonicalMemories(rows: CanonicalMemoryRow[]): string {
  if (rows.length === 0) {
    return '';
  }

  const grouped = new Map<MemoryKind, CanonicalMemoryRow[]>();
  for (const row of rows) {
    if (!grouped.has(row.kind)) {
      grouped.set(row.kind, []);
    }
    grouped.get(row.kind)?.push(row);
  }

  const lines: string[] = ['## Known user/project state'];
  for (const kind of MEMORY_KIND_ORDER) {
    const memories = grouped.get(kind);
    if (!memories?.length) {
      continue;
    }
    for (const memory of memories) {
      lines.push(`- ${kind}: ${memory.key} = "${memory.value}"`);
    }
  }

  return lines.join('\n');
}
