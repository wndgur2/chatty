export const CLASSIFICATION_PORT = Symbol('ClassificationPort');

export interface ClassificationRequest<L extends string = string> {
  systemPrompt: string;
  labels: readonly L[];
  fallback: L;
}

export interface ClassificationPort {
  classify<L extends string>(req: ClassificationRequest<L>): Promise<L>;
}
