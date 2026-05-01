import {
  CoreStateMutationOperation,
  CoreStateValueType,
  Sender,
} from '@prisma/client';

export type MemorySourceType = 'core_state' | 'episodic' | 'semantic';

export type MemoryExtractedFact = {
  content: string;
  factKey?: string;
  confidence?: number;
};

export type MemoryExtractedEpisode = {
  content: string;
  eventType: string;
  happenedAtIso?: string;
  confidence?: number;
};

export type MemoryStateUpdate = {
  key: string;
  operation?: CoreStateMutationOperation;
  value?: string;
  valueType?: CoreStateValueType;
  ttlSeconds?: number;
  confidence?: number;
};

export type MemoryExtractionResult = {
  model: string;
  rawOutput?: string;
  facts: MemoryExtractedFact[];
  episodes: MemoryExtractedEpisode[];
  stateUpdates: MemoryStateUpdate[];
};

export type MemorySourceMessage = {
  id: string;
  sender: Sender;
  content: string;
  createdAt: string;
  chatroomId: number;
  userId: string;
};

export type SemanticMemoryCandidate = {
  id: string;
  type: 'semantic';
  messageId: string;
  content: string;
  createdAt: string;
  score: number;
};

export type EpisodicMemoryCandidate = {
  id: string;
  type: 'episodic';
  messageId: string;
  content: string;
  eventType: string;
  happenedAt: string;
  createdAt: string;
  score: number;
};

export type CoreStateSnapshotItem = {
  id: string;
  type: 'core_state';
  key: string;
  value: string;
  valueType: CoreStateValueType;
  updatedAt: string;
  expiresAt: string | null;
  sourceMessageId: string | null;
  score: number;
};

export type MemoryCandidate =
  | CoreStateSnapshotItem
  | EpisodicMemoryCandidate
  | SemanticMemoryCandidate;

export type RankedMemoryCandidate = MemoryCandidate & {
  rank: number;
  rerankScore: number;
  reason?: string;
};

export type HybridMemoryContext = {
  coreState: CoreStateSnapshotItem[];
  recentEpisodes: EpisodicMemoryCandidate[];
  relevantFacts: SemanticMemoryCandidate[];
  selected: RankedMemoryCandidate[];
};

export type MemoryQueryInput = {
  chatroomId: number;
  query: string;
  recentMessageIds: string[];
  recentConversation: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  k: number;
  tokenBudget?: number;
};
