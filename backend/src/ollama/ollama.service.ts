import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import {
  buildVoluntaryEvaluationPrompt,
  DEFAULT_CHAT_OLLAMA_OPTIONS,
  type VoluntaryEvaluationContext,
  VOLUNTARY_OLLAMA_OPTIONS,
} from '../ai-evaluation.constants';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  public ollama: Ollama;

  private readonly chatModel: string;
  private readonly evalModel: string;

  constructor(private readonly configService: ConfigService) {
    this.chatModel = this.configService.get<string>(
      'OLLAMA_CHAT_MODEL',
      'hf.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF:Q4_K_M',
    );
    this.evalModel = this.configService.get<string>(
      'OLLAMA_EVAL_MODEL',
      'hf.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF:Q4_K_M',
    );
    this.ollama = new Ollama({
      host: this.configService.get<string>(
        'OLLAMA_HOST',
        'http://127.0.0.1:11434',
      ),
    });
  }

  async evaluateToAnswer(
    history: ChatMessage[],
    basePrompt: string,
    ctx: VoluntaryEvaluationContext,
  ): Promise<boolean> {
    try {
      const formattedHistory = history
        .slice(-10)
        .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
        .join('\n');

      const evaluationPrompt = buildVoluntaryEvaluationPrompt(
        basePrompt,
        formattedHistory,
        ctx,
      );

      const response = await this.ollama.chat({
        model: this.evalModel,
        messages: [{ role: 'system', content: evaluationPrompt }],
        stream: false,
      });

      const content = response.message?.content?.trim().toUpperCase() || 'NO';
      return content.includes('YES');
    } catch (e) {
      this.logger.error('Failed to evaluate conversation', e);
      return false; // Default to not answering on fail.
    }
  }

  /**
   * Streams chat completion. Uses `DEFAULT_CHAT_OLLAMA_OPTIONS` for normal replies and
   * `VOLUNTARY_OLLAMA_OPTIONS` when `voluntary` is true.
   */
  async streamChatResponse(
    history: ChatMessage[],
    basePrompt: string,
    streamingOpts?: { voluntary?: boolean },
  ) {
    const options = streamingOpts?.voluntary
      ? { ...VOLUNTARY_OLLAMA_OPTIONS }
      : { ...DEFAULT_CHAT_OLLAMA_OPTIONS };

    return this.ollama.chat({
      model: this.chatModel,
      messages: [{ role: 'system', content: basePrompt }, ...history],
      stream: true,
      options,
    });
  }
}
