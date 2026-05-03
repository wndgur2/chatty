import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import {
  StructuredOutputError,
  StructuredOutputPort,
  StructuredOutputRequest,
} from '../../shared/structured-output.port';
import { OLLAMA_CLIENT } from './ollama-client.provider';

@Injectable()
export class OllamaStructuredOutputAdapter implements StructuredOutputPort {
  private readonly logger = new Logger(OllamaStructuredOutputAdapter.name);
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
    const messages: { role: 'system' | 'user'; content: string }[] = [
      { role: 'system', content: req.systemPrompt },
    ];
    if (req.userPrompt) {
      messages.push({ role: 'user', content: req.userPrompt });
    }

    let raw: string;
    try {
      const response = await this.ollama.chat({
        model: this.evalModel,
        messages,
        stream: false,
        format: req.schema,
        options: req.decoding,
      });
      raw = response.message?.content?.trim() ?? '';
    } catch (e) {
      this.logger.error(
        `Structured output request failed (schema=${req.schemaName ?? 'anonymous'})`,
        e,
      );
      throw new StructuredOutputError('Structured output request failed', e);
    }

    if (!raw) {
      throw new StructuredOutputError('Structured output returned empty body');
    }

    try {
      return JSON.parse(raw) as T;
    } catch (e) {
      this.logger.error(
        `Structured output JSON parse failed (schema=${req.schemaName ?? 'anonymous'}): ${raw.slice(0, 200)}`,
        e,
      );
      throw new StructuredOutputError('Structured output JSON parse failed', e);
    }
  }
}
