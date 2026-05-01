import { formatHybridMemoryContext } from './memory.formatter';

describe('formatHybridMemoryContext', () => {
  it('returns empty string when context is empty', () => {
    expect(
      formatHybridMemoryContext({
        coreState: [],
        recentEpisodes: [],
        relevantFacts: [],
        selected: [],
      }),
    ).toBe('');
  });

  it('renders sectioned memory blocks with precedence headings', () => {
    const output = formatHybridMemoryContext({
      coreState: [
        {
          id: 'core_state:timezone',
          type: 'core_state',
          key: 'timezone',
          value: 'UTC+9',
          valueType: 'text',
          updatedAt: '2026-04-20T00:00:00.000Z',
          expiresAt: null,
          sourceMessageId: '11',
          score: 1,
        },
      ],
      recentEpisodes: [
        {
          id: 'episodic:1',
          type: 'episodic',
          messageId: '9',
          content: 'User switched jobs last week.',
          eventType: 'job_change',
          happenedAt: '2026-04-18T00:00:00.000Z',
          createdAt: '2026-04-18T00:00:00.000Z',
          score: 0.7,
        },
      ],
      relevantFacts: [
        {
          id: 'semantic:1',
          type: 'semantic',
          messageId: '7',
          content: 'User prefers concise checklists.',
          createdAt: '2026-04-10T00:00:00.000Z',
          score: 0.6,
        },
      ],
      selected: [],
    });

    expect(output).toContain('## Hybrid memory context');
    expect(output).toContain('### CoreState (authoritative)');
    expect(output).toContain('### RecentEpisodes (timestamped)');
    expect(output).toContain('### RelevantFacts (background)');
    expect(output).toContain('- timezone: "UTC+9" (updated 2026-04-20)');
    expect(output).toContain(
      '- (2026-04-18) [job_change] "User switched jobs last week."',
    );
    expect(output).toContain(
      '- (2026-04-10) "User prefers concise checklists."',
    );
  });
});
