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

  return [
    '## Relevant earlier context (do not repeat verbatim):',
    ...lines,
  ].join('\n');
}
