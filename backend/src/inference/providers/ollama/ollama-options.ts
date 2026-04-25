export const DEFAULT_CHAT_OLLAMA_OPTIONS = {
  temperature: 0.8,
  repeat_penalty: 1.05,
} as const;

export const VOLUNTARY_OLLAMA_OPTIONS = {
  temperature: 0.4,
  repeat_penalty: 1.12,
  num_predict: 140,
} as const;
