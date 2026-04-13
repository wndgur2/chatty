import { Injectable } from '@nestjs/common';
import { ChatMessage, OllamaService } from '../ollama/ollama.service';

@Injectable()
export class AiResponseService {
  constructor(private readonly ollamaService: OllamaService) {}

  async generate(
    history: ChatMessage[],
    systemPrompt: string,
    onChunk?: (chunk: string) => void,
    opts?: { voluntary?: boolean },
  ) {
    const stream = await this.ollamaService.streamChatResponse(
      history,
      systemPrompt,
      opts?.voluntary ? { voluntary: true } : undefined,
    );
    let fullContent = '';

    for await (const chunk of stream) {
      const text = chunk.message?.content || '';
      if (text) {
        fullContent += text;
        onChunk?.(text);
      }
    }

    return fullContent;
  }
}
