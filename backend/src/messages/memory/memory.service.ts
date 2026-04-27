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
import { MemorySnippet } from './memory.formatter';
import { SemanticChunkerService } from './semantic-chunker.service';

type RetrieveContextInput = {
  k: number;
  recentMessageIds: string[];
};

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);
  private readonly recentWindow: number;
  private readonly minScore: number;
  private readonly snippetChars: number;

  constructor(
    @Inject(EMBEDDING_PORT) private readonly embeddingPort: EmbeddingPort,
    @Inject(VECTOR_STORE_PORT)
    private readonly vectorStorePort: VectorStorePort,
    private readonly prisma: PrismaService,
    private readonly semanticChunkerService: SemanticChunkerService,
    private readonly configService: ConfigService,
  ) {
    this.recentWindow = Number(this.configService.get('RAG_RECENT_WINDOW', 8));
    this.minScore = Number(this.configService.get('RAG_MIN_SCORE', 0.4));
    this.snippetChars = Number(
      this.configService.get('RAG_SNIPPET_CHARS', 200),
    );
  }

  async indexOlderMessage(chatroomId: number): Promise<void> {
    this.logger.debug(
      `Indexing older message candidate for chatroom=${chatroomId}, recentWindow=${this.recentWindow}`,
    );
    const olderMessage = await this.prisma.message.findFirst({
      where: { chatroomId: BigInt(chatroomId) },
      orderBy: { createdAt: 'desc' },
      skip: this.recentWindow,
      select: {
        id: true,
        sender: true,
        content: true,
        createdAt: true,
        chatroom: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!olderMessage) {
      this.logger.debug(
        `No older message to index for chatroom=${chatroomId} after skipping recent window`,
      );
      return;
    }

    if (olderMessage.sender !== 'user') {
      this.logger.debug(
        `Skipping index for message=${olderMessage.id.toString()} because sender=${olderMessage.sender}`,
      );
      return;
    }

    const pointId = olderMessage.id.toString();
    const alreadyIndexed =
      await this.vectorStorePort.hasPointsForMessage(pointId);
    if (alreadyIndexed) {
      this.logger.debug(`Vector points already exist for message=${pointId}`);
      return;
    }

    this.logger.debug(
      `Chunking older message for index: message=${pointId}, contentLength=${olderMessage.content.length}`,
    );
    const chunks = await this.semanticChunkerService.chunk(
      olderMessage.content,
    );
    if (chunks.length === 0) {
      this.logger.warn(`Empty chunk embeddings for message ${pointId}`);
      return;
    }

    const chunkCount = chunks.length;
    for (const [chunkIndex, chunk] of chunks.entries()) {
      await this.vectorStorePort.upsert({
        id: `${pointId}#${chunkIndex}`,
        vector: chunk.embedding,
        payload: {
          chatroomId,
          userId: olderMessage.chatroom.userId.toString(),
          messageId: pointId,
          chunkIndex,
          chunkCount,
          createdAt: olderMessage.createdAt.toISOString(),
          sender: 'user',
          content: chunk.text,
        },
      });
    }

    this.logger.debug(
      `Indexed message=${pointId} into vector store with chunkCount=${chunkCount}`,
    );
  }

  async retrieveContext(
    chatroomId: number,
    query: string,
    opts: RetrieveContextInput,
  ): Promise<MemorySnippet[]> {
    const normalizedQuery = query.trim();
    this.logger.debug(
      `Retrieving memory context for chatroom=${chatroomId}, queryLength=${normalizedQuery.length}, k=${opts.k}, excludeCount=${opts.recentMessageIds.length}`,
    );
    if (!normalizedQuery) {
      this.logger.debug('Skipping memory retrieval because query is empty');
      return [];
    }

    const vector = await this.embeddingPort.embed(normalizedQuery);
    if (vector.length === 0) {
      this.logger.warn(
        `Empty query embedding for chatroom=${chatroomId}; memory retrieval skipped`,
      );
      return [];
    }

    this.logger.debug(
      `Searching vector store for chatroom=${chatroomId} with embeddingDim=${vector.length}, minScore=${this.minScore}`,
    );
    const results = await this.vectorStorePort.search({
      vector,
      limit: opts.k,
      minScore: this.minScore,
      chatroomId,
      excludeMessageIds: opts.recentMessageIds,
    });

    this.logger.debug(
      `Vector search returned ${results.length} candidates for chatroom=${chatroomId}`,
    );

    return results
      .map((result) => ({
        messageId: result.payload.messageId,
        content: result.payload.content.slice(0, this.snippetChars),
        createdAt: result.payload.createdAt,
        score: result.score,
      }))
      .sort((a, b) => b.score - a.score);
  }
}
