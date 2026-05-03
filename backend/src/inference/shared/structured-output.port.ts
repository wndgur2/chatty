export const STRUCTURED_OUTPUT_PORT = Symbol('StructuredOutputPort');

export interface StructuredOutputRequest {
  systemPrompt: string;
  userPrompt?: string;
  schema: Record<string, unknown>;
  schemaName?: string;
  decoding?: {
    temperature?: number;
    num_predict?: number;
  };
  signal?: AbortSignal;
}

export class StructuredOutputError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StructuredOutputError';
  }
}

export interface StructuredOutputPort {
  generate<T>(req: StructuredOutputRequest): Promise<T>;
}
