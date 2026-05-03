import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  type ExtractedMemory,
  type MemoryExtractionPort,
  type MemoryExtractionRequest,
} from '../../ports/memory-extraction.port';
import {
  STRUCTURED_OUTPUT_PORT,
  type StructuredOutputPort,
} from '../../shared/structured-output.port';
import { buildMemoryExtractorPrompt } from '../../prompts/memory-extractor.prompt';

type MemoryExtractionSchemaResponse = {
  memories: ExtractedMemory[];
};

@Injectable()
export class OllamaMemoryExtractionAdapter implements MemoryExtractionPort {
  private readonly logger = new Logger(OllamaMemoryExtractionAdapter.name);

  constructor(
    @Inject(STRUCTURED_OUTPUT_PORT)
    private readonly structured: StructuredOutputPort,
  ) {}

  async extract(req: MemoryExtractionRequest): Promise<ExtractedMemory[]> {
    const systemPrompt = buildMemoryExtractorPrompt(
      req.content,
      req.recentContext,
    );
    const schema = {
      type: 'object',
      properties: {
        memories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              kind: {
                type: 'string',
                enum: [
                  'fact',
                  'preference',
                  'task',
                  'project_state',
                  'relationship',
                  'other',
                ],
              },
              key: { type: 'string' },
              value: { type: 'string' },
              confidence: { type: 'number', minimum: 0, maximum: 1 },
            },
            required: ['kind', 'key', 'value', 'confidence'],
            additionalProperties: false,
          },
        },
      },
      required: ['memories'],
      additionalProperties: false,
    } as const;

    try {
      const response =
        await this.structured.generate<MemoryExtractionSchemaResponse>({
          systemPrompt,
          schema,
          schemaName: 'ExtractedMemories',
        });
      return response.memories;
    } catch (error) {
      this.logger.warn('Memory extraction failed', error);
      return [];
    }
  }
}
