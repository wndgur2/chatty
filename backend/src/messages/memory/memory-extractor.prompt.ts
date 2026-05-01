import { Sender } from '@prisma/client';

export const MEMORY_EXTRACTOR_CLASSIFICATION_LABELS = [
  'EXTRACT',
  'IGNORE',
] as const;

export const MEMORY_EXTRACTOR_CLASSIFICATION_PROMPT = [
  'You are a memory extraction gate.',
  'Return only one label:',
  '- EXTRACT when the message contains durable facts, meaningful events, or state updates.',
  '- IGNORE when the message is filler, greeting-only, or contains no useful memory.',
  'Output one label only.',
].join('\n');

export const MEMORY_EXTRACTOR_JSON_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['facts', 'episodes', 'stateUpdates'],
  properties: {
    facts: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content'],
        properties: {
          content: { type: 'string' },
          factKey: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    episodes: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['content', 'eventType'],
        properties: {
          content: { type: 'string' },
          eventType: { type: 'string' },
          happenedAtIso: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
    stateUpdates: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['key'],
        properties: {
          key: { type: 'string' },
          operation: {
            type: 'string',
            enum: ['upsert', 'delete', 'expire'],
          },
          value: { type: 'string' },
          valueType: {
            type: 'string',
            enum: ['text', 'json', 'number', 'boolean'],
          },
          ttlSeconds: { type: 'integer', minimum: 1 },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
        },
      },
    },
  },
};

export function buildMemoryExtractorPrompt(
  sender: Sender,
  messageContent: string,
): string {
  return [
    'You are MemoryExtractorAgent.',
    'Split memory into three layers and output strict JSON only.',
    'facts: durable background knowledge that should remain stable.',
    'episodes: timestamped event records describing what happened.',
    'stateUpdates: mutable chatroom/user state that can be overwritten.',
    'Rules:',
    '- avoid hallucinations; omit uncertain items',
    '- keep extracted content concise but faithful',
    '- never output markdown or explanation text',
    `source_sender=${sender}`,
    'message:',
    messageContent,
  ].join('\n');
}
