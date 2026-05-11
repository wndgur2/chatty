import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  parseConfigFloat,
  parseConfigInt,
} from '../../../common/utils/parse-config-number.util';
import {
  ExtractedMemory,
  MEMORY_EXTRACTION_PORT,
  type MemoryExtractionPort,
} from '../../../inference/ports/memory-extraction.port';
import { PrismaService } from '../../../prisma/prisma.service';

const RECENT_CONTEXT_WINDOW = 4;

@Injectable()
export class MemoryExtractorService {
  private readonly logger = new Logger(MemoryExtractorService.name);
  private readonly recentWindow: number;
  private readonly minConfidence: number;

  constructor(
    @Inject(MEMORY_EXTRACTION_PORT)
    private readonly memoryExtractionPort: MemoryExtractionPort,
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.recentWindow = parseConfigInt(
      this.configService.get('RAG_RECENT_WINDOW', 8),
      8,
      { min: 0, max: 100_000 },
    );
    this.minConfidence = parseConfigFloat(
      this.configService.get('MEMORY_EXTRACTION_MIN_CONFIDENCE', 0.6),
      0.6,
      { min: 0, max: 1 },
    );
  }

  async extractOlderMessage(chatroomId: number): Promise<void> {
    this.logger.debug(
      `Memory-extracting older message candidate for chatroom=${chatroomId}, recentWindow=${this.recentWindow}`,
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
          select: { userId: true, guestSessionId: true },
        },
      },
    });

    if (!olderMessage) {
      this.logger.debug(
        `No older message to extract for chatroom=${chatroomId} after skipping recent window`,
      );
      return;
    }

    if (olderMessage.sender !== 'user') {
      this.logger.debug(
        `Skipping extraction for message=${olderMessage.id.toString()} because sender=${olderMessage.sender}`,
      );
      return;
    }

    const alreadyExtracted = await this.prisma.memory.findFirst({
      where: { sourceMessageId: olderMessage.id },
      select: { id: true },
    });
    if (alreadyExtracted) {
      this.logger.debug(
        `Memories already extracted from message=${olderMessage.id.toString()}`,
      );
      return;
    }

    const recentContext = await this.loadRecentContext(
      BigInt(chatroomId),
      olderMessage.id,
    );

    const extracted = await this.memoryExtractionPort.extract({
      content: olderMessage.content,
      recentContext,
    });

    if (extracted.length === 0) {
      this.logger.debug(
        `No durable memories extracted from message=${olderMessage.id.toString()}`,
      );
      return;
    }

    const accepted = extracted.filter(
      (m) => m.confidence >= this.minConfidence,
    );
    this.logger.debug(
      `Persisting ${accepted.length}/${extracted.length} extracted memories for message=${olderMessage.id.toString()}`,
    );

    for (const memory of accepted) {
      await this.upsertMemory(
        BigInt(chatroomId),
        olderMessage.chatroom.userId,
        olderMessage.chatroom.guestSessionId,
        olderMessage.id,
        memory,
      );
    }
  }

  private async loadRecentContext(
    chatroomId: bigint,
    excludeMessageId: bigint,
  ): Promise<string | undefined> {
    const recents = await this.prisma.message.findMany({
      where: {
        chatroomId,
        id: { not: excludeMessageId },
      },
      orderBy: { createdAt: 'desc' },
      take: RECENT_CONTEXT_WINDOW,
      select: { sender: true, content: true },
    });
    if (recents.length === 0) return undefined;
    return [...recents]
      .reverse()
      .map((m) => `${m.sender.toUpperCase()}: ${m.content}`)
      .join('\n');
  }

  private async upsertMemory(
    chatroomId: bigint,
    userId: bigint | null,
    guestSessionId: string | null,
    sourceMessageId: bigint,
    memory: ExtractedMemory,
  ): Promise<void> {
    await this.prisma.memory.upsert({
      where: {
        chatroomId_kind_key: {
          chatroomId,
          kind: memory.kind,
          key: memory.key,
        },
      },
      update: {
        value: memory.value,
        confidence: memory.confidence,
        sourceMessageId,
        supersededAt: null,
        userId,
        guestSessionId,
      },
      create: {
        chatroomId,
        userId,
        guestSessionId,
        kind: memory.kind,
        key: memory.key,
        value: memory.value,
        confidence: memory.confidence,
        sourceMessageId,
      },
    });
  }
}
