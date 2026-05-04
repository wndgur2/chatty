import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseConfigInt } from '../../../common/utils/parse-config-number.util';
import {
  EMBEDDING_PORT,
  type EmbeddingPort,
} from '../../../inference/ports/embedding.port';
import {
  bufferSentences,
  cosineDistance,
  percentile,
  splitIntoSentences,
} from '../utils/sentence-split.util';

export type SemanticChunk = {
  text: string;
  embedding: number[];
};

@Injectable()
export class SemanticChunkerService {
  private readonly minChars: number;
  private readonly minSentences: number;
  private readonly bufferSize: number;
  private readonly breakpointPercentile: number;
  private readonly maxChars: number;
  private readonly overlapChars: number;

  constructor(
    @Inject(EMBEDDING_PORT) private readonly embeddingPort: EmbeddingPort,
    private readonly configService: ConfigService,
  ) {
    this.minChars = parseConfigInt(
      this.configService.get('RAG_CHUNK_MIN_CHARS', 200),
      200,
      { min: 50, max: 100_000 },
    );
    this.minSentences = parseConfigInt(
      this.configService.get('RAG_CHUNK_MIN_SENTENCES', 3),
      3,
      { min: 1, max: 500 },
    );
    this.bufferSize = parseConfigInt(
      this.configService.get('RAG_CHUNK_BUFFER_SIZE', 1),
      1,
      { min: 1, max: 50 },
    );
    this.breakpointPercentile = parseConfigInt(
      this.configService.get('RAG_CHUNK_BREAKPOINT_PERCENTILE', 95),
      95,
      { min: 1, max: 99 },
    );
    this.maxChars = parseConfigInt(
      this.configService.get('RAG_CHUNK_MAX_CHARS', 1200),
      1200,
      { min: 50, max: 100_000 },
    );
    const overlapRaw = parseConfigInt(
      this.configService.get('RAG_CHUNK_OVERLAP_CHARS', 200),
      200,
      { min: 0, max: Math.max(0, this.maxChars - 1) },
    );
    this.overlapChars = overlapRaw;
  }

  async chunk(text: string): Promise<SemanticChunk[]> {
    const normalized = text.trim();
    if (!normalized) {
      return [];
    }

    const sentences = splitIntoSentences(normalized);
    if (
      normalized.length < this.minChars ||
      sentences.length <= this.minSentences
    ) {
      const embedding = await this.embeddingPort.embed(normalized);
      return embedding.length > 0 ? [{ text: normalized, embedding }] : [];
    }

    const sentenceWindows = bufferSentences(sentences, this.bufferSize);
    const sentenceEmbeddings =
      await this.embeddingPort.embedBatch(sentenceWindows);
    if (sentenceEmbeddings.length < 2) {
      const embedding = await this.embeddingPort.embed(normalized);
      return embedding.length > 0 ? [{ text: normalized, embedding }] : [];
    }

    const distances: number[] = [];
    for (let index = 0; index < sentenceEmbeddings.length - 1; index += 1) {
      distances.push(
        cosineDistance(
          sentenceEmbeddings[index],
          sentenceEmbeddings[index + 1],
        ),
      );
    }
    const threshold = percentile(distances, this.breakpointPercentile);

    const segments: string[] = [];
    let startIndex = 0;
    for (let index = 0; index < distances.length; index += 1) {
      if (distances[index] > threshold) {
        segments.push(sentences.slice(startIndex, index + 1).join(' '));
        startIndex = index + 1;
      }
    }
    segments.push(sentences.slice(startIndex).join(' '));

    const chunks = this.splitOverMaxChars(segments);
    const embeddings = await this.embeddingPort.embedBatch(chunks);

    return chunks
      .map((chunkText, index) => ({
        text: chunkText,
        embedding: embeddings[index] ?? [],
      }))
      .filter((chunk) => chunk.embedding.length > 0);
  }

  private splitOverMaxChars(chunks: string[]): string[] {
    const output: string[] = [];
    const step = Math.max(1, this.maxChars - this.overlapChars);

    for (const chunk of chunks) {
      if (chunk.length <= this.maxChars) {
        output.push(chunk);
        continue;
      }

      let cursor = 0;
      while (cursor < chunk.length) {
        const end = Math.min(chunk.length, cursor + this.maxChars);
        output.push(chunk.slice(cursor, end).trim());
        if (end >= chunk.length) {
          break;
        }
        cursor += step;
      }
    }

    return output.filter(Boolean);
  }
}
