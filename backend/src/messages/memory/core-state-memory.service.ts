import {
  CoreStateMutationOperation,
  CoreStateValueType,
} from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CoreStateSnapshotItem,
  MemorySourceMessage,
  MemoryStateUpdate,
} from './memory.types';

type UpsertStateUpdatesInput = {
  extractionRunId: string;
  sourceMessage: MemorySourceMessage;
  updates: MemoryStateUpdate[];
};

@Injectable()
export class CoreStateMemoryService {
  private readonly logger = new Logger(CoreStateMemoryService.name);
  private readonly defaultTtlSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.defaultTtlSeconds = Number(
      this.configService.get('MEMORY_STATE_DEFAULT_TTL_SECONDS', 0),
    );
  }

  async upsertStateUpdates(input: UpsertStateUpdatesInput): Promise<void> {
    if (input.updates.length === 0) {
      return;
    }

    const chatroomId = BigInt(input.sourceMessage.chatroomId);
    const userId = BigInt(input.sourceMessage.userId);
    const sourceMessageId = BigInt(input.sourceMessage.id);
    const extractionRunId = BigInt(input.extractionRunId);

    for (const update of input.updates) {
      const normalizedKey = this.normalizeStateKey(update.key);
      if (!normalizedKey) {
        continue;
      }

      const operation = update.operation ?? CoreStateMutationOperation.upsert;
      if (operation === CoreStateMutationOperation.delete) {
        const existing = await this.prisma.coreStateMemory.findUnique({
          where: {
            chatroomId_stateKey: {
              chatroomId,
              stateKey: normalizedKey,
            },
          },
        });
        if (!existing) {
          continue;
        }
        await this.prisma.coreStateMemory.delete({
          where: { id: existing.id },
        });
        await this.prisma.coreStateMutation.create({
          data: {
            coreStateId: existing.id,
            extractionRunId,
            chatroomId,
            sourceMessageId,
            operation,
            previousValue: existing.value,
            nextValue: null,
          },
        });
        continue;
      }

      const existing = await this.prisma.coreStateMemory.findUnique({
        where: {
          chatroomId_stateKey: {
            chatroomId,
            stateKey: normalizedKey,
          },
        },
      });
      const valueType = update.valueType ?? CoreStateValueType.text;
      const nextValue = this.normalizeValue(update.value, valueType);
      const nextExpiresAt = this.resolveExpiresAt(update.ttlSeconds);

      const unchanged =
        existing &&
        existing.value === nextValue &&
        existing.valueType === valueType &&
        this.timestampsEqual(existing.expiresAt, nextExpiresAt);

      let rowId: bigint;
      if (unchanged && existing) {
        rowId = existing.id;
      } else {
        const saved = await this.prisma.coreStateMemory.upsert({
          where: {
            chatroomId_stateKey: {
              chatroomId,
              stateKey: normalizedKey,
            },
          },
          create: {
            chatroomId,
            userId,
            stateKey: normalizedKey,
            value: nextValue,
            valueType,
            sourceMessageId,
            expiresAt: nextExpiresAt,
          },
          update: {
            value: nextValue,
            valueType,
            sourceMessageId,
            expiresAt: nextExpiresAt,
          },
        });
        rowId = saved.id;
      }

      if (unchanged) {
        continue;
      }

      await this.prisma.coreStateMutation.create({
        data: {
          coreStateId: rowId,
          extractionRunId,
          chatroomId,
          sourceMessageId,
          operation:
            operation === CoreStateMutationOperation.expire
              ? CoreStateMutationOperation.expire
              : CoreStateMutationOperation.upsert,
          previousValue: existing?.value ?? null,
          nextValue,
        },
      });
    }

    this.logger.debug(
      `Upserted core state updates chatroom=${input.sourceMessage.chatroomId} updates=${input.updates.length}`,
    );
  }

  async getSnapshot(chatroomId: number): Promise<CoreStateSnapshotItem[]> {
    const now = new Date();
    const rows = await this.prisma.coreStateMemory.findMany({
      where: {
        chatroomId: BigInt(chatroomId),
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ updatedAt: 'desc' }, { stateKey: 'asc' }],
    });

    return rows.map((row) => ({
      id: `core_state:${row.stateKey}`,
      type: 'core_state',
      key: row.stateKey,
      value: row.value,
      valueType: row.valueType,
      updatedAt: row.updatedAt.toISOString(),
      expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
      sourceMessageId: row.sourceMessageId ? row.sourceMessageId.toString() : null,
      score: 1,
    }));
  }

  private resolveExpiresAt(ttlSeconds?: number): Date | null {
    const effectiveTtl =
      ttlSeconds && ttlSeconds > 0 ? ttlSeconds : this.defaultTtlSeconds;
    if (!effectiveTtl || effectiveTtl <= 0) {
      return null;
    }
    return new Date(Date.now() + effectiveTtl * 1000);
  }

  private normalizeStateKey(key: string): string {
    return key.trim().toLowerCase().slice(0, 191);
  }

  private normalizeValue(
    value: string | undefined,
    valueType: CoreStateValueType,
  ): string {
    const normalized = (value ?? '').trim();
    if (!normalized) {
      return '';
    }

    if (valueType === CoreStateValueType.number) {
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? String(parsed) : '0';
    }
    if (valueType === CoreStateValueType.boolean) {
      return normalized.toLowerCase() === 'true' ? 'true' : 'false';
    }
    if (valueType === CoreStateValueType.json) {
      try {
        JSON.parse(normalized);
        return normalized;
      } catch {
        return JSON.stringify(normalized);
      }
    }
    return normalized;
  }

  private timestampsEqual(
    left: Date | null | undefined,
    right: Date | null | undefined,
  ): boolean {
    if (!left && !right) {
      return true;
    }
    if (!left || !right) {
      return false;
    }
    return left.getTime() === right.getTime();
  }
}
