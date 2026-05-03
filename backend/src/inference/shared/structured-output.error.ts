export class StructuredOutputError extends Error {
  readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'StructuredOutputError';
    this.cause = cause;
  }
}
