import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import {
  StructuredOutputPort,
  StructuredOutputRequest,
} from '../../ports/structured-output.port';
import { OLLAMA_CLIENT } from './ollama-client.provider';

@Injectable()
export class OllamaStructuredOutputAdapter implements StructuredOutputPort {
  private readonly logger = new Logger(OllamaStructuredOutputAdapter.name);
  private readonly model: string;

  constructor(
    @Inject(OLLAMA_CLIENT) private readonly ollama: Ollama,
    private readonly configService: ConfigService,
  ) {
    const evalModel = this.configService.get<string>(
      'OLLAMA_EVAL_MODEL',
      'hf.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF:Q4_K_M',
    );
    this.model = this.configService.get<string>(
      'OLLAMA_STRUCTURED_OUTPUT_MODEL',
      evalModel,
    );
  }

  async extract<T>(req: StructuredOutputRequest): Promise<T | null> {
    try {
      const response = await this.ollama.chat({
        model: this.model,
        messages: [
          { role: 'system', content: req.systemPrompt },
          { role: 'user', content: req.userPrompt },
        ],
        format: req.jsonSchema,
        stream: false,
      });

      const content = response.message?.content?.trim();
      if (!content) {
        return null;
      }

      return JSON.parse(content) as T;
    } catch (error) {
      this.logger.warn('Structured output request failed', error);
      return null;
    }
  }
}
