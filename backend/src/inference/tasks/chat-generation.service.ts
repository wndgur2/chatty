import { Inject, Injectable } from '@nestjs/common';
import {
  CHAT_COMPLETION_PORT,
  type ChatCompletionPort,
} from '../ports/chat-completion.port';
import { ChatMessage } from '../shared/chat-message';
import {
  DEFAULT_CHAT_OLLAMA_OPTIONS,
  VOLUNTARY_OLLAMA_OPTIONS,
} from '../providers/ollama/ollama-options';

@Injectable()
export class ChatGenerationService {
  constructor(
    @Inject(CHAT_COMPLETION_PORT)
    private readonly chatCompletionPort: ChatCompletionPort,
  ) {}

  async generate(
    history: ChatMessage[],
    systemPrompt: string,
    onChunk?: (chunk: string) => void,
    opts?: { proactive?: boolean },
  ) {
    const decoding = opts?.proactive
      ? { ...VOLUNTARY_OLLAMA_OPTIONS }
      : { ...DEFAULT_CHAT_OLLAMA_OPTIONS };
    const stream = this.chatCompletionPort.stream({
      messages: history,
      systemPrompt,
      decoding,
    });
    let fullContent = '';

    for await (const chunk of stream) {
      const text = chunk.delta;
      if (text) {
        fullContent += text;
        onChunk?.(text);
      }
    }

    return fullContent;
  }
}
