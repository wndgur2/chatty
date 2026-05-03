import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MEMORY_EXTRACTION_PORT,
  type MemoryExtractionPort,
} from '../../inference/ports/memory-extraction.port';

@Injectable()
export class MemoryExtractorService {
  private readonly logger = new Logger(MemoryExtractorService.name);
  private readonly recentWindow: number;
  private readonly minConfidence: number;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MEMORY_EXTRACTION_PORT)
    private readonly memoryExtractionPort: MemoryExtractionPort,
    private readonly configService: ConfigService,
  ) {
    this.recentWindow = Number(this.configService.get('RAG_RECENT_WINDOW', 8));
    this.minConfidence = Number(
      this.configService.get('MEMORY_MIN_CONFIDENCE', 0.6),
    );
  }

  async extractOlderMessage(chatroomId: number): Promise<void> {
    const olderMessage = await this.prisma.message.findFirst({
      where: { chatroomId: BigInt(chatroomId) },
      orderBy: { createdAt: 'desc' },
      skip: this.recentWindow,
      select: {
        id: true,
        sender: true,
        content: true,
        chatroomId: true,
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

    const alreadyExtracted = await this.prisma.memory.findFirst({
      where: { sourceMessageId: olderMessage.id },
      select: { id: true },
    });
    if (alreadyExtracted) {
      return;
    }

    const recentMessages = await this.prisma.message.findMany({
      where: { chatroomId: olderMessage.chatroomId },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: {
        sender: true,
        content: true,
      },
    });
    const recentContext = recentMessages
      .reverse()
      .map((message) => `${message.sender.toUpperCase()}: ${message.content}`)
      .join('\n');

    const memories = await this.memoryExtractionPort.extract({
      content: olderMessage.content,
      recentContext,
    });

    for (const memory of memories) {
      if (memory.confidence < this.minConfidence) {
        continue;
      }

      await this.prisma.memory.upsert({
        where: {
          chatroomId_kind_key: {
            chatroomId: olderMessage.chatroomId,
            kind: memory.kind,
            key: memory.key,
          },
        },
        update: {
          value: memory.value,
          confidence: memory.confidence,
          sourceMessageId: olderMessage.id,
          supersededAt: null,
        },
        create: {
          chatroomId: olderMessage.chatroomId,
          userId: olderMessage.chatroom.userId,
          kind: memory.kind,
          key: memory.key,
          value: memory.value,
          confidence: memory.confidence,
          sourceMessageId: olderMessage.id,
        },
      });
    }

    this.logger.debug(
      `Processed ${memories.length} extracted memories for chatroom=${chatroomId}`,
    );
  }
}
