import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  ExtractedMemory,
  MEMORY_KINDS,
  MemoryExtractionPort,
  MemoryExtractionRequest,
  MemoryKind,
} from '../../ports/memory-extraction.port';
import {
  buildMemoryExtractorUserPrompt,
  MEMORY_EXTRACTOR_SYSTEM_PROMPT,
} from '../../prompts/memory-extractor.prompt';
import {
  STRUCTURED_OUTPUT_PORT,
  type StructuredOutputPort,
} from '../../shared/structured-output.port';

const MEMORY_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    memories: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          kind: {
            type: 'string',
            enum: [...MEMORY_KINDS],
          },
          key: { type: 'string' },
          value: { type: 'string' },
          confidence: { type: 'number' },
        },
        required: ['kind', 'key', 'value', 'confidence'],
        additionalProperties: false,
      },
    },
  },
  required: ['memories'],
  additionalProperties: false,
} as const;

const KIND_SET = new Set<MemoryKind>(MEMORY_KINDS);

@Injectable()
export class OllamaMemoryExtractionAdapter implements MemoryExtractionPort {
  private readonly logger = new Logger(OllamaMemoryExtractionAdapter.name);

  constructor(
    @Inject(STRUCTURED_OUTPUT_PORT)
    private readonly structuredOutputPort: StructuredOutputPort,
  ) {}

  async extract(req: MemoryExtractionRequest): Promise<ExtractedMemory[]> {
    try {
      const { memories } = await this.structuredOutputPort.generate<{
        memories: ExtractedMemory[];
      }>({
        systemPrompt: MEMORY_EXTRACTOR_SYSTEM_PROMPT,
        userPrompt: buildMemoryExtractorUserPrompt(
          req.content,
          req.recentContext,
        ),
        schema: MEMORY_EXTRACTION_SCHEMA as unknown as Record<string, unknown>,
        schemaName: 'MemoryExtraction',
        decoding: { temperature: 0.2 },
      });

      if (!Array.isArray(memories)) {
        return [];
      }

      return memories
        .map((m) => this.normalize(m))
        .filter((m): m is ExtractedMemory => m !== null);
    } catch (e) {
      this.logger.error('Memory extraction failed', e);
      return [];
    }
  }

  private normalize(raw: ExtractedMemory): ExtractedMemory | null {
    if (!raw || typeof raw !== 'object') return null;
    if (!KIND_SET.has(raw.kind)) return null;
    const key = typeof raw.key === 'string' ? raw.key.trim() : '';
    const value = typeof raw.value === 'string' ? raw.value.trim() : '';
    if (!key || !value) return null;
    const confidence =
      typeof raw.confidence === 'number' && Number.isFinite(raw.confidence)
        ? Math.max(0, Math.min(1, raw.confidence))
        : 0;
    return { kind: raw.kind, key, value, confidence };
  }
}
