import { MEMORY_SNIPPETS_PROMPT } from '../../inference/prompts/chat-system.prompt';

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
