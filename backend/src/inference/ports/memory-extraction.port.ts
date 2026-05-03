export const MEMORY_EXTRACTION_PORT = Symbol('MemoryExtractionPort');

export const MEMORY_KINDS = [
  'fact',
  'preference',
  'task',
  'project_state',
  'relationship',
  'other',
] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];

export const MEMORY_EXTRACTION_SCHEMA = {
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

export interface ExtractedMemory {
  kind: MemoryKind;
  key: string;
  value: string;
  confidence: number;
}

export interface MemoryExtractionRequest {
  content: string;
  recentContext?: string;
}

export interface MemoryExtractionPort {
  extract(req: MemoryExtractionRequest): Promise<ExtractedMemory[]>;
}
