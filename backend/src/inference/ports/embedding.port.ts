export const EMBEDDING_PORT = Symbol('EmbeddingPort');

export interface EmbeddingPort {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}
