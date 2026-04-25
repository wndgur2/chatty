import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import {
  ClassificationPort,
  ClassificationRequest,
} from '../../ports/classification.port';
import { OLLAMA_CLIENT } from './ollama-client.provider';

@Injectable()
export class OllamaClassificationAdapter implements ClassificationPort {
  private readonly logger = new Logger(OllamaClassificationAdapter.name);
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

  async classify<L extends string>(req: ClassificationRequest<L>): Promise<L> {
    try {
      const response = await this.ollama.chat({
        model: this.evalModel,
        messages: [{ role: 'system', content: req.systemPrompt }],
        stream: false,
      });

      const normalized = response.message?.content?.trim().toUpperCase() ?? '';
      const matched = req.labels.find((label) => normalized.includes(label));
      return matched ?? req.fallback;
    } catch (e) {
      this.logger.error('Classification request failed', e);
      return req.fallback;
    }
  }
}
