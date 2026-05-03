import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from './ollama-client.provider';
import {
  StructuredOutputPort,
  StructuredOutputRequest,
} from '../../shared/structured-output.port';
import { StructuredOutputError } from '../../shared/structured-output.error';

@Injectable()
export class OllamaStructuredOutputAdapter implements StructuredOutputPort {
  private readonly evalModel: string;

  constructor(
    @Inject(OLLAMA_CLIENT) private readonly ollama: Ollama,
    private readonly configService: ConfigService,
  ) {
    this.evalModel = this.configService.get<string>(
      'OLLAMA_EVAL_MODEL',
      'hf.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF:Q4_K_M',
    );
  }

  async generate<T>(req: StructuredOutputRequest): Promise<T> {
    try {
      const response = await this.ollama.chat({
        model: this.evalModel,
        messages: [
          { role: 'system', content: req.systemPrompt },
          ...(req.userPrompt ? [{ role: 'user' as const, content: req.userPrompt }] : []),
        ],
        stream: false,
        format: req.schema,
        options: req.decoding,
      });

      const content = response.message?.content?.trim();
      if (!content) {
        throw new StructuredOutputError('Structured output response was empty');
      }
      return JSON.parse(content) as T;
    } catch (error) {
      if (error instanceof StructuredOutputError) {
        throw error;
      }
      throw new StructuredOutputError('Structured output generation failed', {
        cause: error,
      });
    }
  }
}
