import { CoreStateMutationOperation, CoreStateValueType } from '@prisma/client';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CHAT_COMPLETION_PORT,
  type ChatCompletionPort,
} from '../../inference/ports/chat-completion.port';
import {
  CLASSIFICATION_PORT,
  type ClassificationPort,
} from '../../inference/ports/classification.port';
import {
  buildMemoryExtractorPrompt,
  MEMORY_EXTRACTOR_CLASSIFICATION_LABELS,
  MEMORY_EXTRACTOR_CLASSIFICATION_PROMPT,
  MEMORY_EXTRACTOR_JSON_SCHEMA,
} from './memory-extractor.prompt';
import {
  MemoryExtractedEpisode,
  MemoryExtractedFact,
  MemoryExtractionResult,
  MemorySourceMessage,
  MemoryStateUpdate,
} from './memory.types';

@Injectable()
export class MemoryExtractorAgentService {
  private readonly logger = new Logger(MemoryExtractorAgentService.name);
  private readonly enabled: boolean;

  constructor(
    @Inject(CHAT_COMPLETION_PORT)
    private readonly chatCompletionPort: ChatCompletionPort,
    @Inject(CLASSIFICATION_PORT)
    private readonly classificationPort: ClassificationPort,
    private readonly configService: ConfigService,
  ) {
    this.enabled =
      this.configService.get<string>('MEMORY_EXTRACTOR_ENABLED', 'true') ===
      'true';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async extractFromMessage(
    sourceMessage: MemorySourceMessage,
  ): Promise<MemoryExtractionResult> {
    if (!this.enabled || !sourceMessage.content.trim()) {
      return {
        model: this.extractorModelName(),
        facts: [],
        episodes: [],
        stateUpdates: [],
      };
    }

    const shouldExtract = await this.shouldExtract(sourceMessage.content);
    if (!shouldExtract) {
      this.logger.debug(
        `Extractor skipped by classifier for message=${sourceMessage.id}`,
      );
      return {
        model: this.extractorModelName(),
        facts: [],
        episodes: [],
        stateUpdates: [],
      };
    }

    const prompt = buildMemoryExtractorPrompt(
      sourceMessage.sender,
      sourceMessage.content,
    );
    const rawOutput = await this.collectTextFromStream(prompt);
    const parsed = this.parseOutput(rawOutput);

    return {
      model: this.extractorModelName(),
      rawOutput,
      facts: parsed.facts,
      episodes: parsed.episodes,
      stateUpdates: parsed.stateUpdates,
    };
  }

  private extractorModelName(): string {
    return this.configService.get<string>(
      'OLLAMA_EVAL_MODEL',
      'hf.co/TrevorJS/gemma-4-E2B-it-uncensored-GGUF:Q4_K_M',
    );
  }

  private async shouldExtract(content: string): Promise<boolean> {
    const label = await this.classificationPort.classify<
      (typeof MEMORY_EXTRACTOR_CLASSIFICATION_LABELS)[number]
    >({
      systemPrompt: `${MEMORY_EXTRACTOR_CLASSIFICATION_PROMPT}\n\n${content}`,
      labels: MEMORY_EXTRACTOR_CLASSIFICATION_LABELS,
      fallback: 'IGNORE',
    });

    return label === 'EXTRACT';
  }

  private async collectTextFromStream(systemPrompt: string): Promise<string> {
    const stream = this.chatCompletionPort.stream({
      messages: [],
      systemPrompt,
      responseFormat: {
        type: 'json_schema',
        schema: MEMORY_EXTRACTOR_JSON_SCHEMA,
      },
      decoding: { temperature: 0.1 },
    });

    let text = '';
    for await (const chunk of stream) {
      text += chunk.delta;
    }
    return text.trim();
  }

  private parseOutput(raw: string): {
    facts: MemoryExtractedFact[];
    episodes: MemoryExtractedEpisode[];
    stateUpdates: MemoryStateUpdate[];
  } {
    if (!raw) {
      return { facts: [], episodes: [], stateUpdates: [] };
    }

    const parsed = this.tryParseJson(raw);
    if (!parsed) {
      this.logger.warn('Memory extractor output parse failed');
      return { facts: [], episodes: [], stateUpdates: [] };
    }

    const facts = this.parseFacts(parsed.facts);
    const episodes = this.parseEpisodes(parsed.episodes);
    const stateUpdates = this.parseStateUpdates(parsed.stateUpdates);
    return { facts, episodes, stateUpdates };
  }

  private tryParseJson(raw: string): Record<string, unknown> | null {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      const start = raw.indexOf('{');
      const end = raw.lastIndexOf('}');
      if (start === -1 || end <= start) {
        return null;
      }
      try {
        const sliced: unknown = JSON.parse(raw.slice(start, end + 1));
        if (sliced && typeof sliced === 'object') {
          return sliced as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  private parseFacts(value: unknown): MemoryExtractedFact[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const facts: MemoryExtractedFact[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const record = item as Record<string, unknown>;
      const content = this.asTrimmed(record.content);
      if (!content) {
        continue;
      }

      const fact: MemoryExtractedFact = { content };
      const factKey = this.asTrimmed(record.factKey);
      if (factKey) {
        fact.factKey = factKey;
      }
      const confidence = this.toConfidence(record.confidence);
      if (typeof confidence === 'number') {
        fact.confidence = confidence;
      }
      facts.push(fact);
    }
    return facts;
  }

  private parseEpisodes(value: unknown): MemoryExtractedEpisode[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const episodes: MemoryExtractedEpisode[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const record = item as Record<string, unknown>;
      const content = this.asTrimmed(record.content);
      const eventType = this.asTrimmed(record.eventType);
      if (!content || !eventType) {
        continue;
      }

      const episode: MemoryExtractedEpisode = {
        content,
        eventType,
      };
      const happenedAtIso = this.asTrimmed(record.happenedAtIso);
      if (happenedAtIso) {
        episode.happenedAtIso = happenedAtIso;
      }
      const confidence = this.toConfidence(record.confidence);
      if (typeof confidence === 'number') {
        episode.confidence = confidence;
      }
      episodes.push(episode);
    }
    return episodes;
  }

  private parseStateUpdates(value: unknown): MemoryStateUpdate[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const updates: MemoryStateUpdate[] = [];
    for (const item of value) {
      if (!item || typeof item !== 'object') {
        continue;
      }
      const record = item as Record<string, unknown>;
      const key = this.asTrimmed(record.key);
      if (!key) {
        continue;
      }

      const update: MemoryStateUpdate = { key };
      const operation = this.toOperation(record.operation);
      if (operation) {
        update.operation = operation;
      }
      const valueText = this.asOptionalTrimmed(record.value);
      if (valueText !== undefined) {
        update.value = valueText;
      }
      const valueType = this.toValueType(record.valueType);
      if (valueType) {
        update.valueType = valueType;
      }
      const ttlSeconds = this.toPositiveInteger(record.ttlSeconds);
      if (ttlSeconds !== undefined) {
        update.ttlSeconds = ttlSeconds;
      }
      const confidence = this.toConfidence(record.confidence);
      if (typeof confidence === 'number') {
        update.confidence = confidence;
      }
      updates.push(update);
    }
    return updates;
  }

  private asTrimmed(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asOptionalTrimmed(value: unknown): string | undefined {
    const normalized = this.asTrimmed(value);
    return normalized || undefined;
  }

  private toOperation(value: unknown): MemoryStateUpdate['operation'] {
    const normalized = this.asTrimmed(value).toLowerCase();
    if (normalized === CoreStateMutationOperation.upsert) {
      return CoreStateMutationOperation.upsert;
    }
    if (normalized === CoreStateMutationOperation.delete) {
      return CoreStateMutationOperation.delete;
    }
    if (normalized === CoreStateMutationOperation.expire) {
      return CoreStateMutationOperation.expire;
    }
    return undefined;
  }

  private toValueType(value: unknown): MemoryStateUpdate['valueType'] {
    const normalized = this.asTrimmed(value).toLowerCase();
    if (normalized === CoreStateValueType.text) {
      return CoreStateValueType.text;
    }
    if (normalized === CoreStateValueType.json) {
      return CoreStateValueType.json;
    }
    if (normalized === CoreStateValueType.number) {
      return CoreStateValueType.number;
    }
    if (normalized === CoreStateValueType.boolean) {
      return CoreStateValueType.boolean;
    }
    return undefined;
  }

  private toPositiveInteger(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed) && parsed > 0) {
        return Math.floor(parsed);
      }
    }
    return undefined;
  }

  private toConfidence(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return Math.max(0, Math.min(1, value));
    }
    if (typeof value === 'string') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(1, parsed));
      }
    }
    return undefined;
  }
}
