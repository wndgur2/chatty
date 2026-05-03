import {
  formatCanonicalMemories,
  formatMemorySnippets,
  MemorySnippet,
} from './memory.formatter';
import {
  MEMORY_SNIPPETS_PROMPT,
} from '../../inference/prompts/chat-system.prompt';
import { MemoryKind } from '@prisma/client';

describe('formatMemorySnippets', () => {
  it('returns an empty string when there are no snippets', () => {
    expect(formatMemorySnippets([])).toBe('');
  });

  it('renders a heading with usage guardrails and dated snippet lines', () => {
    const snippets: MemorySnippet[] = [
      {
        messageId: '7',
        content: 'I deploy with prisma migrate deploy in CI.',
        createdAt: '2026-04-12T10:00:00.000Z',
        score: 0.91,
      },
      {
        messageId: '8',
        content: 'My laptop is a 16-inch MacBook Pro.',
        createdAt: '2026-04-13T08:30:00.000Z',
        score: 0.74,
      },
    ];

    const output = formatMemorySnippets(snippets);

    for (const line of MEMORY_SNIPPETS_PROMPT.split('\n')) {
      expect(output).toContain(line);
    }
    expect(output).toContain(
      '- (2026-04-12) "I deploy with prisma migrate deploy in CI."',
    );
    expect(output).toContain(
      '- (2026-04-13) "My laptop is a 16-inch MacBook Pro."',
    );
  });

  it('keeps the original order of snippets', () => {
    const snippets: MemorySnippet[] = [
      {
        messageId: '1',
        content: 'first',
        createdAt: '2026-04-10T00:00:00.000Z',
        score: 0.9,
      },
      {
        messageId: '2',
        content: 'second',
        createdAt: '2026-04-11T00:00:00.000Z',
        score: 0.8,
      },
    ];

    const output = formatMemorySnippets(snippets);
    const firstIdx = output.indexOf('"first"');
    const secondIdx = output.indexOf('"second"');

    expect(firstIdx).toBeGreaterThan(-1);
    expect(secondIdx).toBeGreaterThan(firstIdx);
  });

  it('renders grouped canonical memories by kind', () => {
    const output = formatCanonicalMemories([
      {
        kind: MemoryKind.preference,
        key: 'tone',
        value: 'casual',
      },
      {
        kind: MemoryKind.project_state,
        key: 'current_project',
        value: 'Chatty backend refactor',
      },
      {
        kind: MemoryKind.preference,
        key: 'timezone',
        value: 'UTC+7',
      },
    ]);

    expect(output).toContain('## Known user/project state');
    expect(output).toContain('- preference: tone = "casual"');
    expect(output).toContain('- preference: timezone = "UTC+7"');
    expect(output).toContain(
      '- project_state: current_project = "Chatty backend refactor"',
    );
  });
});
