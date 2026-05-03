import { Injectable } from '@nestjs/common';
import { MemoryKind } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryService } from './memory.service';
import { MemorySnippet } from './memory.formatter';

type RetrieveInput = {
  k: number;
  recentMessageIds: string[];
};

@Injectable()
export class MemoryRetrieverService {
  private readonly canonicalLimit: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
  ) {
    this.canonicalLimit = 50;
  }

  async retrieve(
    chatroomId: number,
    query: string,
    opts: RetrieveInput,
  ): Promise<{
    canonical: Array<{
      kind: MemoryKind;
      key: string;
      value: string;
      confidence: number;
      updatedAt: Date;
    }>;
    snippets: MemorySnippet[];
  }> {
    const [canonical, snippets] = await Promise.all([
      this.prisma.memory.findMany({
        where: { chatroomId: BigInt(chatroomId), supersededAt: null },
        orderBy: [{ kind: 'asc' }, { updatedAt: 'desc' }],
        take: this.canonicalLimit,
        select: {
          kind: true,
          key: true,
          value: true,
          confidence: true,
          updatedAt: true,
        },
      }),
      this.memoryService.retrieveContext(chatroomId, query, opts),
    ]);

    return { canonical, snippets };
  }
}
