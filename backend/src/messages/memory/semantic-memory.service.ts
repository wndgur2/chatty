import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Sender } from '@prisma/client';
import {
  EMBEDDING_PORT,
  type EmbeddingPort,
} from '../../inference/ports/embedding.port';
import { PrismaService } from '../../prisma/prisma.service';
import {
  VECTOR_STORE_PORT,
  type VectorStorePort,
} from '../../infrastructure/vector-store/vector-store.port';
import { SemanticChunkerService } from './semantic-chunker.service';
import {
  MemoryExtractedFact,
  MemoryQueryInput,
  MemorySourceMessage,
  SemanticMemoryCandidate,
} from './memory.types';

@Injectable()
export class SemanticMemoryService {
  private readonly logger = new Logger(SemanticMemoryService.name);
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

    if (!olderMessage || olderMessage.sender !== 'user') {
      return;
    }

    const messageId = olderMessage.id.toString();
    const alreadyIndexed = await this.vectorStorePort.hasPointsForMessage(
      messageId,
      'semantic',
    );
    if (alreadyIndexed) {
      return;
    }

    const chunks = await this.semanticChunkerService.chunk(
      olderMessage.content,
    );
    if (chunks.length === 0) {
      this.logger.warn(`Empty chunk embeddings for message ${messageId}`);
      return;
    }

    const chunkCount = chunks.length;
    for (const [chunkIndex, chunk] of chunks.entries()) {
      await this.vectorStorePort.upsert({
        id: `${messageId}#semantic#${chunkIndex}`,
        vector: chunk.embedding,
        payload: {
          memoryType: 'semantic',
          chatroomId,
          userId: olderMessage.chatroom.userId.toString(),
          messageId,
          chunkIndex,
          chunkCount,
          createdAt: olderMessage.createdAt.toISOString(),
          sender: 'user',
          content: chunk.text,
        },
      });
    }
  }

  async findMessageForExtraction(
    messageId: string,
  ): Promise<MemorySourceMessage | null> {
    const parsedId = this.toBigInt(messageId);
    if (parsedId == null) {
      return null;
    }

    const message = await this.prisma.message.findUnique({
      where: { id: parsedId },
      select: {
        id: true,
        sender: true,
        content: true,
        createdAt: true,
        chatroomId: true,
        chatroom: {
          select: { userId: true },
        },
      },
    });
    if (!message) {
      return null;
    }

    return {
      id: message.id.toString(),
      sender: message.sender,
      content: message.content,
      createdAt: message.createdAt.toISOString(),
      chatroomId: Number(message.chatroomId),
      userId: message.chatroom.userId.toString(),
    };
  }

  async createExtractionRun(params: {
    chatroomId: number;
    sourceMessageId: string;
    sourceSender: Sender;
    model: string;
    rawOutput?: string;
  }): Promise<{ id: bigint }> {
    return this.prisma.memoryExtractionRun.create({
      data: {
        chatroomId: BigInt(params.chatroomId),
        sourceMessageId: BigInt(params.sourceMessageId),
        sourceSender: params.sourceSender,
        extractorModel: params.model,
        rawOutput:
          params.rawOutput != null
            ? (params.rawOutput as Prisma.InputJsonValue)
            : Prisma.JsonNull,
      },
      select: { id: true },
    });
  }

  async writeFacts(params: {
    extractionRunId: string;
    sourceMessage: MemorySourceMessage;
    facts: MemoryExtractedFact[];
  }): Promise<void> {
    const extractionRunId = BigInt(params.extractionRunId);
    const chatroomIdBigInt = BigInt(params.sourceMessage.chatroomId);

    for (const [factIndex, fact] of params.facts.entries()) {
      const normalizedFact = fact.content.trim();
      if (!normalizedFact) {
        continue;
      }

      const chunks = await this.semanticChunkerService.chunk(normalizedFact);
      if (chunks.length === 0) {
        continue;
      }

      const chunkCount = chunks.length;
      for (const [chunkIndex, chunk] of chunks.entries()) {
        const vectorPointId = `${params.sourceMessage.id}#fact#${factIndex}#${chunkIndex}`;
        await this.vectorStorePort.upsert({
          id: vectorPointId,
          vector: chunk.embedding,
          payload: {
            memoryType: 'semantic',
            chatroomId: params.sourceMessage.chatroomId,
            userId: params.sourceMessage.userId,
            messageId: params.sourceMessage.id,
            chunkIndex,
            chunkCount,
            createdAt: params.sourceMessage.createdAt,
            sender: params.sourceMessage.sender,
            content: chunk.text,
          },
        });

        await this.prisma.semanticMemoryRecord.upsert({
          where: {
            chatroomId_vectorPointId: {
              chatroomId: chatroomIdBigInt,
              vectorPointId,
            },
          },
          create: {
            chatroomId: chatroomIdBigInt,
            userId: BigInt(params.sourceMessage.userId),
            sourceMessageId: BigInt(params.sourceMessage.id),
            extractionRunId,
            vectorPointId,
            factKey: fact.factKey?.trim() || null,
            content: chunk.text,
            confidence:
              typeof fact.confidence === 'number' ? fact.confidence : null,
          },
          update: {
            extractionRunId,
            factKey: fact.factKey?.trim() || null,
            content: chunk.text,
            confidence:
              typeof fact.confidence === 'number' ? fact.confidence : null,
          },
        });
      }
    }
  }

  async retrieveFacts(
    input: MemoryQueryInput,
  ): Promise<SemanticMemoryCandidate[]> {
    const normalizedQuery = input.query.trim();
    if (!normalizedQuery) {
      return [];
    }

    const vector = await this.embeddingPort.embed(normalizedQuery);
    if (vector.length === 0) {
      this.logger.warn(
        `Semantic retrieval skipped due to empty query embedding for chatroom=${input.chatroomId}`,
      );
      return [];
    }

    const results = await this.vectorStorePort.search({
      vector,
      limit: input.k,
      minScore: this.minScore,
      chatroomId: input.chatroomId,
      excludeMessageIds: input.recentMessageIds,
      memoryType: 'semantic',
    });

    return results
      .map((result, index) => ({
        id: `semantic:${result.payload.messageId}:${result.id}:${index}`,
        type: 'semantic' as const,
        messageId: result.payload.messageId,
        content: result.payload.content.slice(0, this.snippetChars),
        createdAt: result.payload.createdAt,
        score: result.score,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, input.k);
  }

  private toBigInt(value: string): bigint | null {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
}
