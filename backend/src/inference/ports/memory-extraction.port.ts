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
