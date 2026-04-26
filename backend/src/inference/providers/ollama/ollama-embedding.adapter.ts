import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ollama } from 'ollama';
import { EmbeddingPort } from '../../ports/embedding.port';
import { OLLAMA_CLIENT } from './ollama-client.provider';

@Injectable()
export class OllamaEmbeddingAdapter implements EmbeddingPort {
  private readonly embedModel: string;

  constructor(
    @Inject(OLLAMA_CLIENT) private readonly ollama: Ollama,
    private readonly configService: ConfigService,
  ) {
    this.embedModel = this.configService.get<string>(
      'OLLAMA_EMBED_MODEL',
      'all-minilm',
    );
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.ollama.embed({
      model: this.embedModel,
      input: text,
    });
    return response.embeddings?.[0] ?? [];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    const response = await this.ollama.embed({
      model: this.embedModel,
      input: texts,
    });

    return response.embeddings ?? [];
  }
}
