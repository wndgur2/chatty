export const STRUCTURED_OUTPUT_PORT = Symbol('StructuredOutputPort');

export interface StructuredOutputRequest {
  systemPrompt: string;
  userPrompt: string;
  jsonSchema: Record<string, unknown>;
}

export interface StructuredOutputPort {
  extract<T>(req: StructuredOutputRequest): Promise<T | null>;
}
