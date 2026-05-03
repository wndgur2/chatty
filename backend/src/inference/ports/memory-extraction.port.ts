export const MEMORY_EXTRACTION_PORT = Symbol('MemoryExtractionPort');

export type MemoryKind =
  | 'fact'
  | 'preference'
  | 'task'
  | 'project_state'
  | 'relationship'
  | 'other';

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
