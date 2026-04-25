import { ChatMessage } from '../shared/chat-message';

export const CHAT_COMPLETION_PORT = Symbol('ChatCompletionPort');

export type DecodingOptions = {
  temperature?: number;
  repeat_penalty?: number;
  num_predict?: number;
};

export type ToolDefinition = {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
};

export type ResponseFormat =
  | { type: 'text' }
  | {
      type: 'json_schema';
      schema: Record<string, unknown>;
    };

export interface ChatCompletionRequest {
  messages: ChatMessage[];
  systemPrompt: string;
  decoding?: DecodingOptions;
  tools?: ToolDefinition[];
  responseFormat?: ResponseFormat;
  signal?: AbortSignal;
}

export interface ChatCompletionStreamChunk {
  delta: string;
}

export interface ChatCompletionPort {
  stream(req: ChatCompletionRequest): AsyncIterable<ChatCompletionStreamChunk>;
}
