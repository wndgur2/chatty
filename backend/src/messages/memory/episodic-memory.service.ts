import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  EMBEDDING_PORT,
  type EmbeddingPort,
} from '../../inference/ports/embedding.port';
import {
  VECTOR_STORE_PORT,
  type VectorStorePort,
} from '../../infrastructure/vector-store/vector-store.port';
import {
  EpisodicMemoryCandidate,
  MemoryExtractedEpisode,
  MemoryQueryInput,
  MemorySourceMessage,
} from './memory.types';

@Injectable()
export class EpisodicMemoryService {
  private readonly logger = new Logger(EpisodicMemoryService.name);
  private readonly minScore: number;
  private readonly snippetChars: number;
  private readonly candidateLimit: number;

  constructor(
    @Inject(EMBEDDING_PORT) private readonly embeddingPort: EmbeddingPort,
    @Inject(VECTOR_STORE_PORT)
    private readonly vectorStorePort: VectorStorePort,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.minScore = Number(this.configService.get('RAG_MIN_SCORE', 0.4));
    this.snippetChars = Number(
      this.configService.get('RAG_SNIPPET_CHARS', 200),
    );
    this.candidateLimit = Number(
      this.configService.get('MEMORY_RETRIEVER_CANDIDATE_LIMIT', 8),
    );
  }

  async writeEpisodes(input: {
    extractionRunId: string;
    sourceMessage: MemorySourceMessage;
    episodes: MemoryExtractedEpisode[];
  }): Promise<void> {
    const { extractionRunId, sourceMessage, episodes } = input;
    if (episodes.length === 0) {
      return;
    }

    for (const [episodeIndex, episode] of episodes.entries()) {
      const content = episode.content.trim();
      if (!content) {
        continue;
      }

      const embedding = await this.embeddingPort.embed(content);
      if (embedding.length === 0) {
        this.logger.warn(
          `Empty episodic embedding for message=${sourceMessage.id} index=${episodeIndex}`,
        );
        continue;
      }

      const vectorPointId = `${sourceMessage.id}#episode#${episodeIndex}`;
      await this.vectorStorePort.upsert({
        id: vectorPointId,
        vector: embedding,
        payload: {
          memoryType: 'episodic',
          memoryRecordId: vectorPointId,
          chatroomId: sourceMessage.chatroomId,
          userId: sourceMessage.userId,
          messageId: sourceMessage.id,
          chunkIndex: episodeIndex,
          chunkCount: episodes.length,
          createdAt: sourceMessage.createdAt,
          sender: sourceMessage.sender,
          content,
        },
      });

      await this.prisma.episodicMemoryRecord.upsert({
        where: {
          chatroomId_vectorPointId: {
            chatroomId: BigInt(sourceMessage.chatroomId),
            vectorPointId,
          },
        },
        create: {
          chatroomId: BigInt(sourceMessage.chatroomId),
          userId: BigInt(sourceMessage.userId),
          sourceMessageId: BigInt(sourceMessage.id),
          extractionRunId: BigInt(extractionRunId),
          vectorPointId,
          eventType: episode.eventType.trim().slice(0, 191) || 'event',
          happenedAt: this.parseHappenedAt(
            episode.happenedAtIso,
            sourceMessage.createdAt,
          ),
          content,
          confidence:
            typeof episode.confidence === 'number' ? episode.confidence : null,
        },
        update: {
          extractionRunId: BigInt(extractionRunId),
          eventType: episode.eventType.trim().slice(0, 191) || 'event',
          happenedAt: this.parseHappenedAt(
            episode.happenedAtIso,
            sourceMessage.createdAt,
          ),
          content,
          confidence:
            typeof episode.confidence === 'number' ? episode.confidence : null,
        },
      });
    }
  }

  async retrieveEpisodes(
    input: MemoryQueryInput,
  ): Promise<EpisodicMemoryCandidate[]> {
    const query = input.query.trim();
    if (!query) {
      return [];
    }

    const vector = await this.embeddingPort.embed(query);
    if (vector.length === 0) {
      this.logger.warn(
        `Episodic retrieval skipped due to empty query embedding chatroom=${input.chatroomId}`,
      );
      return [];
    }

    const limit = Math.max(input.k, this.candidateLimit);
    const results = await this.vectorStorePort.search({
      vector,
      limit,
      minScore: this.minScore,
      chatroomId: input.chatroomId,
      memoryType: 'episodic',
      excludeMessageIds: input.recentMessageIds,
    });

    if (results.length === 0) {
      return [];
    }

    const vectorIds = results
      .map((result) => result.payload.memoryRecordId)
      .filter((id): id is string => Boolean(id));
    const metadataRows = await this.prisma.episodicMemoryRecord.findMany({
      where: {
        chatroomId: BigInt(input.chatroomId),
        vectorPointId: { in: vectorIds },
      },
      select: {
        vectorPointId: true,
        eventType: true,
        happenedAt: true,
      },
    });
    const metaByVectorPointId = new Map(
      metadataRows.map((row) => [row.vectorPointId, row]),
    );

    return results
      .map((result) => {
        const recordId = result.payload.memoryRecordId;
        const meta = recordId ? metaByVectorPointId.get(recordId) : undefined;
        const eventType = meta?.eventType ?? 'event';
        const happenedAt =
          meta?.happenedAt.toISOString() ?? result.payload.createdAt;
        return {
          id: recordId ?? `episodic:${result.payload.messageId}:${happenedAt}`,
          type: 'episodic' as const,
          messageId: result.payload.messageId,
          content: result.payload.content.slice(0, this.snippetChars),
          eventType,
          happenedAt,
          createdAt: result.payload.createdAt,
          score: result.score,
        };
      })
      .sort((left, right) => right.score - left.score)
      .slice(0, limit);
  }

  private parseHappenedAt(
    happenedAtIso: string | undefined,
    fallbackIso: string,
  ): Date {
    if (happenedAtIso) {
      const parsed = new Date(happenedAtIso);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
      this.logger.warn(
        `Invalid happenedAtIso="${happenedAtIso}" from extractor`,
      );
    }
    const fallback = new Date(fallbackIso);
    if (!Number.isNaN(fallback.getTime())) {
      return fallback;
    }
    return new Date();
  }
}
