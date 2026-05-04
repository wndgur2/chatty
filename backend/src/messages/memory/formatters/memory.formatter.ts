import {
  CANONICAL_MEMORY_PROMPT,
  MEMORY_SNIPPETS_PROMPT,
} from '../../../inference/prompts/chat-system.prompt';
import { MemoryKind } from '../../../inference/ports/memory-extraction.port';

export type MemorySnippet = {
  messageId: string;
  content: string;
  createdAt: string;
  score: number;
};

export type CanonicalMemory = {
  kind: MemoryKind;
  key: string;
  value: string;
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

export function formatCanonicalMemories(memories: CanonicalMemory[]): string {
  if (memories.length === 0) {
    return '';
  }

  const lines = memories.map((m) => `- ${m.kind}: ${m.key} = "${m.value}"`);
  return `${CANONICAL_MEMORY_PROMPT}\n\n${lines.join('\n')}`;
}
