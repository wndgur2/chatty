import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildMemoryExtractorUserPrompt,
  MEMORY_EXTRACTOR_JSON_SCHEMA,
  MEMORY_EXTRACTOR_SYSTEM,
  type MemoryExtractorResult,
} from '../../../inference/prompts/memory-extractor.prompt';
import {
  STRUCTURED_OUTPUT_PORT,
  type StructuredOutputPort,
} from '../../../inference/ports/structured-output.port';
import {
  ChatroomFactRepository,
  type ChatroomFactOpInput,
} from './chatroom-fact.repository';

type ExtractFromTurnInput = {
  chatroomId: number;
  userMessage: string;
  aiMessage: string;
  sourceMessageId: bigint;
};

@Injectable()
export class MemoryExtractorService {
  private readonly logger = new Logger(MemoryExtractorService.name);
  private readonly maxOpsPerTurn: number;

  constructor(
    @Inject(STRUCTURED_OUTPUT_PORT)
    private readonly structuredOutputPort: StructuredOutputPort,
    private readonly chatroomFactRepository: ChatroomFactRepository,
    private readonly configService: ConfigService,
  ) {
    this.maxOpsPerTurn = Number(
      this.configService.get('MEMORY_EXTRACTOR_MAX_OPS_PER_TURN', 10),
    );
  }

  async extractFromTurn(input: ExtractFromTurnInput): Promise<void> {
    const currentFacts = await this.chatroomFactRepository.findAllForChatroom(
      input.chatroomId,
    );
    const userPrompt = buildMemoryExtractorUserPrompt({
      currentFacts: currentFacts.map((fact) => ({
        key: fact.key,
        value: fact.value,
        valueType: fact.valueType,
      })),
      userMessage: input.userMessage,
      aiMessage: input.aiMessage,
    });

    const extraction =
      await this.structuredOutputPort.extract<MemoryExtractorResult>({
        systemPrompt: MEMORY_EXTRACTOR_SYSTEM,
        userPrompt,
        jsonSchema: MEMORY_EXTRACTOR_JSON_SCHEMA,
      });
    if (!extraction) {
      this.logger.warn(
        `Structured extractor returned null for chatroom=${input.chatroomId}`,
      );
      return;
    }

    const normalizedOps = this.normalizeOps(extraction);
    if (normalizedOps.length === 0) {
      return;
    }

    await this.chatroomFactRepository.applyOps(
      input.chatroomId,
      normalizedOps,
      input.sourceMessageId,
    );
  }

  private normalizeOps(result: MemoryExtractorResult): ChatroomFactOpInput[] {
    const safeOps = Array.isArray(result.ops) ? result.ops : [];
    const capped = safeOps.slice(0, this.maxOpsPerTurn);
    const normalized: ChatroomFactOpInput[] = [];

    for (const op of capped) {
      if (!op || typeof op !== 'object') {
        continue;
      }
      if (op.op !== 'set' && op.op !== 'delete') {
        continue;
      }
      if (typeof op.key !== 'string' || op.key.trim().length === 0) {
        continue;
      }

      const key = op.key.trim().slice(0, 128);
      const confidence =
        typeof op.confidence === 'number' ? op.confidence : undefined;

      if (op.op === 'delete') {
        normalized.push({ op: 'delete', key, confidence });
        continue;
      }

      if (typeof op.valueType !== 'string') {
        continue;
      }

      normalized.push({
        op: 'set',
        key,
        value: op.value,
        valueType: op.valueType,
        confidence,
      });
    }

    return normalized;
  }
}
