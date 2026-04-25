import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import {
  ChatCompletionPort,
  ChatCompletionRequest,
  ChatCompletionStreamChunk,
} from '../../ports/chat-completion.port';
import { OLLAMA_CLIENT } from './ollama-client.provider';

@Injectable()
export class OllamaChatCompletionAdapter implements ChatCompletionPort {
  private readonly chatModel: string;

  constructor(
    @Inject(OLLAMA_CLIENT) private readonly ollama: Ollama,
    private readonly configService: ConfigService,
  ) {
    this.chatModel = this.configService.get<string>(
      'OLLAMA_CHAT_MODEL',
      'hf.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF:Q4_K_M',
    );
  }

  async *stream(
    req: ChatCompletionRequest,
  ): AsyncIterable<ChatCompletionStreamChunk> {
    const stream = await this.ollama.chat({
      model: this.chatModel,
      messages: [
        { role: 'system', content: req.systemPrompt },
        ...req.messages,
      ],
      stream: true,
      options: req.decoding,
    });

    for await (const chunk of stream) {
      const delta = chunk.message?.content ?? '';
      yield { delta };
    }
  }
}
