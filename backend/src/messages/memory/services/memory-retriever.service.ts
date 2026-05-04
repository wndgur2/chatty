import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { parseConfigInt } from '../../../common/utils/parse-config-number.util';
import { PrismaService } from '../../../prisma/prisma.service';
import { MemoryService } from './memory.service';
import { CanonicalMemory, MemorySnippet } from '../formatters/memory.formatter';

export type MemoryRetrievalInput = {
  k: number;
  recentMessageIds: string[];
};

export type MemoryRetrievalResult = {
  canonical: CanonicalMemory[];
  snippets: MemorySnippet[];
};

@Injectable()
export class MemoryRetrieverService {
  private readonly logger = new Logger(MemoryRetrieverService.name);
  private readonly canonicalLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
    private readonly configService: ConfigService,
  ) {
    this.canonicalLimit = parseConfigInt(
      this.configService.get('MEMORY_CANONICAL_LIMIT', 20),
      20,
      { min: 1, max: 10_000 },
    );
  }

  async retrieve(
    chatroomId: number,
    query: string,
    opts: MemoryRetrievalInput,
  ): Promise<MemoryRetrievalResult> {
    const [canonicalRows, snippets] = await Promise.all([
      this.loadCanonical(chatroomId),
      this.memoryService.retrieveContext(chatroomId, query, opts),
    ]);

    this.logger.debug(
      `Retrieved ${canonicalRows.length} canonical memories and ${snippets.length} semantic snippets for chatroom=${chatroomId}`,
    );

    const canonical: CanonicalMemory[] = canonicalRows.map((row) => ({
      kind: row.kind,
      key: row.key,
      value: row.value,
    }));

    return { canonical, snippets };
  }

  private async loadCanonical(chatroomId: number) {
    return this.prisma.memory.findMany({
      where: {
        chatroomId: BigInt(chatroomId),
        supersededAt: null,
      },
      orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }],
      take: this.canonicalLimit,
      select: {
        kind: true,
        key: true,
        value: true,
      },
    });
  }
}
