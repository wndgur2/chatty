import {
  HYBRID_MEMORY_BLOCK_PROMPT,
  HYBRID_MEMORY_CONFLICT_RULES_PROMPT,
} from '../../inference/prompts/chat-system.prompt';
import { HybridMemoryContext } from './memory.types';

function isoToDate(iso: string): string {
  return iso.slice(0, 10);
}

export function formatHybridMemoryContext(
  context: HybridMemoryContext,
): string {
  const { coreState, recentEpisodes, relevantFacts } = context;
  if (
    coreState.length === 0 &&
    recentEpisodes.length === 0 &&
    relevantFacts.length === 0
  ) {
    return '';
  }

  const sections: string[] = [HYBRID_MEMORY_BLOCK_PROMPT, ''];
  sections.push(HYBRID_MEMORY_CONFLICT_RULES_PROMPT, '');

  sections.push('### CoreState (authoritative)');
  if (coreState.length === 0) {
    sections.push('- (none)');
  } else {
    for (const item of coreState) {
      sections.push(
        `- ${item.key}: "${item.value}" (updated ${isoToDate(item.updatedAt)})`,
      );
    }
  }

  sections.push('', '### RecentEpisodes (timestamped)');
  if (recentEpisodes.length === 0) {
    sections.push('- (none)');
  } else {
    for (const episode of recentEpisodes) {
      sections.push(
        `- (${isoToDate(episode.happenedAt)}) [${episode.eventType}] "${episode.content}"`,
      );
    }
  }

  sections.push('', '### RelevantFacts (background)');
  if (relevantFacts.length === 0) {
    sections.push('- (none)');
  } else {
    for (const fact of relevantFacts) {
      sections.push(`- (${isoToDate(fact.createdAt)}) "${fact.content}"`);
    }
  }

  return sections.join('\n');
}
