export type MemoryFactValueType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'list'
  | 'object';

export type MemoryExtractorOp = {
  op: 'set' | 'delete';
  key: string;
  value?: unknown;
  valueType?: MemoryFactValueType;
  confidence?: number;
};

export type MemoryExtractorResult = {
  ops: MemoryExtractorOp[];
};

export const MEMORY_EXTRACTOR_SYSTEM = [
  'You update a "Core State" memory.',
  'Output strict JSON that follows the schema.',
  'Only include stable facts that are useful in future turns.',
  'Use op="set" to add or update facts and op="delete" to remove facts that are no longer true.',
  'Use dotted keys for nested paths (example: user_preference.tone).',
  'If confidence is low, keep confidence near 0.0 so callers can filter it out.',
].join('\n');

export const MEMORY_EXTRACTOR_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    ops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          op: { enum: ['set', 'delete'] },
          key: { type: 'string', maxLength: 128 },
          value: {},
          valueType: {
            enum: ['string', 'number', 'boolean', 'list', 'object'],
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
        required: ['op', 'key'],
      },
    },
  },
  required: ['ops'],
};

export function buildMemoryExtractorUserPrompt(input: {
  currentFacts: Array<{ key: string; value: unknown; valueType: string }>;
  userMessage: string;
  aiMessage: string;
}): string {
  return JSON.stringify(
    {
      currentFacts: input.currentFacts,
      turn: {
        userMessage: input.userMessage,
        aiMessage: input.aiMessage,
      },
      instruction:
        'Return only the ops needed to keep currentFacts accurate after this turn.',
    },
    null,
    2,
  );
}
