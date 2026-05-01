import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreStateMemoryService } from './core-state-memory.service';
import { EpisodicMemoryService } from './episodic-memory.service';
import { MemoryExtractorAgentService } from './memory-extractor.agent.service';
import { MemoryRetrieverAgentService } from './memory-retriever.agent.service';
import {
  HybridMemoryContext,
  MemoryQueryInput,
  MemorySourceType,
} from './memory.types';
import { SemanticMemoryService } from './semantic-memory.service';

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly extractionEnabled: boolean;
  private readonly retrievalEnabled: boolean;
  private readonly extractionIncludeAiTurns: boolean;
  private readonly retrievalCandidateLimit: number;
  private readonly retrievalFinalLimit: number;

  constructor(
    private readonly semanticMemoryService: SemanticMemoryService,
    private readonly episodicMemoryService: EpisodicMemoryService,
    private readonly coreStateMemoryService: CoreStateMemoryService,
    private readonly memoryExtractorAgentService: MemoryExtractorAgentService,
    private readonly memoryRetrieverAgentService: MemoryRetrieverAgentService,
    private readonly configService: ConfigService,
  ) {
    this.extractionEnabled =
      this.configService.get<string>('MEMORY_EXTRACTOR_ENABLED', 'true') ===
      'true';
    this.retrievalEnabled =
      this.configService.get<string>('MEMORY_RETRIEVER_ENABLED', 'true') ===
      'true';
    this.extractionIncludeAiTurns =
      this.configService.get<string>(
        'MEMORY_EXTRACTOR_INCLUDE_AI_TURNS',
        'false',
      ) === 'true';
    this.retrievalCandidateLimit = Number(
      this.configService.get('MEMORY_RETRIEVER_CANDIDATE_LIMIT', 8),
    );
    this.retrievalFinalLimit = Number(
      this.configService.get('MEMORY_RETRIEVER_FINAL_LIMIT', 5),
    );
  }

  async indexOlderMessage(chatroomId: number): Promise<void> {
    await this.semanticMemoryService.indexOlderMessage(chatroomId);
  }

  async extractFromMessage(messageId: string): Promise<void> {
    if (!this.extractionEnabled) {
      return;
    }

    const sourceMessage =
      await this.semanticMemoryService.findMessageForExtraction(messageId);
    if (!sourceMessage) {
      this.logger.debug(
        `Skipping extraction: source message ${messageId} not found`,
      );
      return;
    }

    if (sourceMessage.sender === 'ai' && !this.extractionIncludeAiTurns) {
      this.logger.debug(
        `Skipping extraction for ai message=${messageId}; includeAiTurns disabled`,
      );
      return;
    }

    const extraction =
      await this.memoryExtractorAgentService.extractFromMessage(sourceMessage);
    if (
      extraction.facts.length === 0 &&
      extraction.episodes.length === 0 &&
      extraction.stateUpdates.length === 0
    ) {
      this.logger.debug(
        `Memory extractor yielded no records for message=${messageId}`,
      );
      return;
    }

    const extractionRun = await this.semanticMemoryService.createExtractionRun({
      chatroomId: sourceMessage.chatroomId,
      sourceMessageId: sourceMessage.id,
      sourceSender: sourceMessage.sender,
      model: extraction.model,
      rawOutput: extraction.rawOutput,
    });

    if (extraction.facts.length > 0) {
      await this.semanticMemoryService.writeFacts({
        extractionRunId: extractionRun.id.toString(),
        sourceMessage,
        facts: extraction.facts,
      });
    }

    if (extraction.episodes.length > 0) {
      await this.episodicMemoryService.writeEpisodes({
        extractionRunId: extractionRun.id.toString(),
        sourceMessage,
        episodes: extraction.episodes,
      });
    }

    if (extraction.stateUpdates.length > 0) {
      await this.coreStateMemoryService.upsertStateUpdates({
        extractionRunId: extractionRun.id.toString(),
        sourceMessage,
        updates: extraction.stateUpdates,
      });
    }
  }

  async retrieveContext(input: MemoryQueryInput): Promise<HybridMemoryContext> {
    if (!this.retrievalEnabled) {
      return this.emptyContext();
    }

    const [facts, episodes, coreState] = await Promise.all([
      this.semanticMemoryService.retrieveFacts(input),
      this.episodicMemoryService.retrieveEpisodes(input),
      this.coreStateMemoryService.getSnapshot(input.chatroomId),
    ]);
    this.logger.debug(
      `Hybrid retrieval candidates chatroom=${input.chatroomId} facts=${facts.length} episodes=${episodes.length} state=${coreState.length}`,
    );

    const finalLimit = Math.max(1, Math.min(input.k, this.retrievalFinalLimit));
    const candidateLimit = Math.max(this.retrievalCandidateLimit, input.k);
    const selected = await this.memoryRetrieverAgentService.rerank({
      query: input.query,
      recentConversation: input.recentConversation,
      candidates: [...coreState, ...episodes, ...facts],
      candidateLimit,
      finalLimit,
      tokenBudget: input.tokenBudget,
    });
    const boundedSelected = selected.slice(0, finalLimit);

    const byId = new Map(
      boundedSelected.map((candidate) => [candidate.id, candidate]),
    );
    const selectedFacts = facts.filter((fact) => byId.has(fact.id));
    const selectedEpisodes = episodes.filter((episode) => byId.has(episode.id));
    const selectedState = coreState.filter((state) => byId.has(state.id));
    const fallbackTypeOrder: Record<MemorySourceType, number> = {
      core_state: 0,
      episodic: 1,
      semantic: 2,
    };
    const sortedSelected = [...boundedSelected].sort((left, right) => {
      const rankDelta = left.rank - right.rank;
      if (rankDelta !== 0) {
        return rankDelta;
      }
      return fallbackTypeOrder[left.type] - fallbackTypeOrder[right.type];
    });

    return {
      coreState: selectedState,
      recentEpisodes: selectedEpisodes,
      relevantFacts: selectedFacts,
      selected: sortedSelected,
    };
  }

  private emptyContext(): HybridMemoryContext {
    return {
      coreState: [],
      recentEpisodes: [],
      relevantFacts: [],
      selected: [],
    };
  }
}
