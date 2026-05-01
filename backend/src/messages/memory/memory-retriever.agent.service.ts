import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  CHAT_COMPLETION_PORT,
  type ChatCompletionPort,
} from '../../inference/ports/chat-completion.port';
import { HYBRID_MEMORY_RERANK_PROMPT } from './memory-retriever.prompt';
import { MemoryCandidate, RankedMemoryCandidate } from './memory.types';

const RERANK_RESPONSE_SCHEMA: Record<string, unknown> = {
  type: 'object',
  additionalProperties: false,
  required: ['selected'],
  properties: {
    selected: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['memoryId', 'score'],
        properties: {
          memoryId: { type: 'string' },
          score: { type: 'number', minimum: 0, maximum: 1 },
          reason: { type: 'string' },
        },
      },
    },
  },
};

type RerankOutput = {
  selected?: Array<{
    memoryId?: string;
    score?: number;
    reason?: string;
  }>;
};

@Injectable()
export class MemoryRetrieverAgentService {
  private readonly logger = new Logger(MemoryRetrieverAgentService.name);

  constructor(
    @Inject(CHAT_COMPLETION_PORT)
    private readonly chatCompletionPort: ChatCompletionPort,
  ) {}

  async rerank(input: {
    query: string;
    recentConversation: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }>;
    candidates: MemoryCandidate[];
    candidateLimit: number;
    finalLimit: number;
    tokenBudget?: number;
  }): Promise<RankedMemoryCandidate[]> {
    if (input.candidates.length === 0 || input.finalLimit <= 0) {
      return [];
    }

    const boundedCandidates = input.candidates.slice(
      0,
      Math.max(input.candidateLimit, input.finalLimit),
    );

    const fallback = this.heuristicFallback(
      boundedCandidates,
      input.finalLimit,
    );
    const prompt = this.buildPrompt(
      input.query,
      input.recentConversation,
      boundedCandidates,
      input.tokenBudget,
    );
    const rawOutput = await this.collectTextFromStream(prompt);
    const parsed = this.parseRerankOutput(rawOutput);
    if (!parsed || !parsed.selected) {
      return fallback;
    }

    const byId = new Map(
      boundedCandidates.map((candidate) => [candidate.id, candidate]),
    );
    const ranked: RankedMemoryCandidate[] = [];

    for (const row of parsed.selected) {
      const memoryId = typeof row.memoryId === 'string' ? row.memoryId : '';
      const candidate = byId.get(memoryId);
      if (!candidate) {
        continue;
      }
      const score = this.normalizeScore(row.score);
      ranked.push({
        ...candidate,
        rank: ranked.length + 1,
        rerankScore: score,
        reason:
          typeof row.reason === 'string'
            ? row.reason.trim() || undefined
            : undefined,
      });
      byId.delete(memoryId);
      if (ranked.length >= input.finalLimit) {
        break;
      }
    }

    if (ranked.length < input.finalLimit) {
      const remainder = fallback.filter(
        (candidate) => !ranked.some((selected) => selected.id === candidate.id),
      );
      for (const candidate of remainder) {
        ranked.push({
          ...candidate,
          rank: ranked.length + 1,
        });
        if (ranked.length >= input.finalLimit) {
          break;
        }
      }
    }

    this.logger.debug(
      `Memory reranker selected=${ranked.length} from candidates=${boundedCandidates.length}`,
    );
    return ranked;
  }

  private buildPrompt(
    query: string,
    recentConversation: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }>,
    candidates: MemoryCandidate[],
    tokenBudget?: number,
  ): string {
    const recent = recentConversation
      .slice(-8)
      .map(
        (turn, index) =>
          `${index + 1}. role=${turn.role}; content=${JSON.stringify(turn.content)}`,
      )
      .join('\n');

    const candidateLines = this.renderCandidatesWithBudget(
      candidates,
      tokenBudget,
    );

    return [
      HYBRID_MEMORY_RERANK_PROMPT,
      '',
      `User query: ${query}`,
      '',
      'Recent conversation:',
      recent || '(none)',
      '',
      'Candidates:',
      candidateLines || '(none)',
    ].join('\n');
  }

  private renderCandidatesWithBudget(
    candidates: MemoryCandidate[],
    tokenBudget?: number,
  ): string {
    const charBudget =
      typeof tokenBudget === 'number' &&
      Number.isFinite(tokenBudget) &&
      tokenBudget > 0
        ? Math.floor(tokenBudget * 4)
        : Number.POSITIVE_INFINITY;
    const lines: string[] = [];
    let consumed = 0;

    for (const [index, candidate] of candidates.entries()) {
      const line = this.renderCandidateLine(index, candidate);
      if (lines.length > 0 && consumed + line.length > charBudget) {
        break;
      }
      lines.push(line);
      consumed += line.length;
    }

    return lines.join('\n');
  }

  private renderCandidateLine(
    index: number,
    candidate: MemoryCandidate,
  ): string {
    if (candidate.type === 'core_state') {
      return `${index + 1}. id=${candidate.id}; type=core_state; key=${candidate.key}; value=${JSON.stringify(candidate.value)}; updatedAt=${candidate.updatedAt};`;
    }
    if (candidate.type === 'episodic') {
      return `${index + 1}. id=${candidate.id}; type=episodic; eventType=${candidate.eventType}; happenedAt=${candidate.happenedAt}; content=${JSON.stringify(candidate.content)}; score=${candidate.score.toFixed(4)};`;
    }
    return `${index + 1}. id=${candidate.id}; type=semantic; createdAt=${candidate.createdAt}; content=${JSON.stringify(candidate.content)}; score=${candidate.score.toFixed(4)};`;
  }

  private async collectTextFromStream(systemPrompt: string): Promise<string> {
    const stream = this.chatCompletionPort.stream({
      messages: [],
      systemPrompt,
      responseFormat: {
        type: 'json_schema',
        schema: RERANK_RESPONSE_SCHEMA,
      },
      decoding: { temperature: 0.1 },
    });
    let text = '';
    for await (const chunk of stream) {
      text += chunk.delta;
    }
    return text.trim();
  }

  private parseRerankOutput(rawOutput: string): RerankOutput | null {
    if (!rawOutput) {
      return null;
    }
    try {
      const parsed: unknown = JSON.parse(rawOutput);
      if (parsed && typeof parsed === 'object') {
        return parsed as RerankOutput;
      }
      return null;
    } catch {
      const start = rawOutput.indexOf('{');
      const end = rawOutput.lastIndexOf('}');
      if (start < 0 || end <= start) {
        this.logger.warn('Memory reranker output missing JSON object');
        return null;
      }
      try {
        const parsed: unknown = JSON.parse(rawOutput.slice(start, end + 1));
        if (parsed && typeof parsed === 'object') {
          return parsed as RerankOutput;
        }
      } catch {
        this.logger.warn('Memory reranker output parse failed');
      }
      return null;
    }
  }

  private heuristicFallback(
    candidates: MemoryCandidate[],
    finalLimit: number,
  ): RankedMemoryCandidate[] {
    const precedence = { core_state: 0, episodic: 1, semantic: 2 } as const;
    const sorted = [...candidates].sort((left, right) => {
      const precedenceDelta = precedence[left.type] - precedence[right.type];
      if (precedenceDelta !== 0) {
        return precedenceDelta;
      }
      if (left.type === 'core_state' && right.type === 'core_state') {
        return (
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
        );
      }
      if (left.type === 'episodic' && right.type === 'episodic') {
        const dateDelta =
          new Date(right.happenedAt).getTime() -
          new Date(left.happenedAt).getTime();
        if (dateDelta !== 0) {
          return dateDelta;
        }
      }
      return right.score - left.score;
    });

    return sorted.slice(0, finalLimit).map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      rerankScore: candidate.score,
      reason: 'heuristic fallback',
    }));
  }

  private normalizeScore(score: unknown): number {
    if (typeof score === 'number' && Number.isFinite(score)) {
      return Math.max(0, Math.min(1, score));
    }
    if (typeof score === 'string') {
      const parsed = Number(score);
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.min(1, parsed));
      }
    }
    return 0.5;
  }
}
