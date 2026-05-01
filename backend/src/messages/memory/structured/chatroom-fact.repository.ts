import { Injectable } from '@nestjs/common';
import { Prisma, type ChatroomFact } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { MemoryExtractorOp } from '../../../inference/prompts/memory-extractor.prompt';

export type ChatroomFactOpInput = MemoryExtractorOp;

type FindFactsOptions = {
  minConfidence?: number;
};

@Injectable()
export class ChatroomFactRepository {
  private readonly extractorMinConfidence: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.extractorMinConfidence = Number(
      this.configService.get('MEMORY_EXTRACTOR_MIN_CONFIDENCE', 0.4),
    );
  }

  async applyOps(
    chatroomId: number,
    ops: ChatroomFactOpInput[],
    sourceMessageId?: bigint,
  ): Promise<void> {
    if (ops.length === 0) {
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      for (const rawOp of ops) {
        const key = rawOp.key?.trim();
        if (!key || key.length > 128) {
          continue;
        }

        const confidence = this.normalizeConfidence(rawOp.confidence);
        if (confidence < this.extractorMinConfidence) {
          continue;
        }

        if (rawOp.op === 'delete') {
          await tx.chatroomFact.deleteMany({
            where: { chatroomId: BigInt(chatroomId), key },
          });
          continue;
        }

        const valueType = rawOp.valueType?.trim();
        if (!valueType || typeof rawOp.value === 'undefined') {
          continue;
        }

        await tx.chatroomFact.upsert({
          where: {
            chatroomId_key: {
              chatroomId: BigInt(chatroomId),
              key,
            },
          },
          create: {
            chatroomId: BigInt(chatroomId),
            key,
            value: rawOp.value as Prisma.InputJsonValue,
            valueType,
            confidence,
            sourceMessageId,
            extractedAt: new Date(),
          },
          update: {
            value: rawOp.value as Prisma.InputJsonValue,
            valueType,
            confidence,
            sourceMessageId,
            extractedAt: new Date(),
          },
        });
      }
    });
  }

  findAllForChatroom(
    chatroomId: number,
    opts?: FindFactsOptions,
  ): Promise<ChatroomFact[]> {
    return this.prisma.chatroomFact.findMany({
      where: {
        chatroomId: BigInt(chatroomId),
        ...(opts?.minConfidence != null
          ? { confidence: { gte: opts.minConfidence } }
          : {}),
      },
      orderBy: [{ key: 'asc' }],
    });
  }

  async deleteByChatroom(chatroomId: number): Promise<void> {
    await this.prisma.chatroomFact.deleteMany({
      where: { chatroomId: BigInt(chatroomId) },
    });
  }

  private normalizeConfidence(value: number | undefined): number {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return 1;
    }

    return Math.max(0, Math.min(1, value));
  }
}
