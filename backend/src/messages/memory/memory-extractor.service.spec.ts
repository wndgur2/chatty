/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MemoryExtractorService } from './memory-extractor.service';
import { MEMORY_EXTRACTION_PORT } from '../../inference/ports/memory-extraction.port';
import { PrismaService } from '../../prisma/prisma.service';

const mockMemoryExtractionPort = {
  extract: jest.fn(),
};

const mockPrismaService = {
  message: {
    findFirst: jest.fn(),
    findMany: jest.fn(),
  },
  memory: {
    findFirst: jest.fn(),
    upsert: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn((key: string, fallback: number | string) => fallback),
};

describe('MemoryExtractorService', () => {
  let service: MemoryExtractorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryExtractorService,
        { provide: MEMORY_EXTRACTION_PORT, useValue: mockMemoryExtractionPort },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MemoryExtractorService>(MemoryExtractorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockPrismaService.message.findMany.mockResolvedValue([]);
    mockPrismaService.memory.findFirst.mockResolvedValue(null);
    mockMemoryExtractionPort.extract.mockResolvedValue([]);
  });

  it('skips when older message is not a user message', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 21n,
      sender: 'ai',
      content: 'ai note',
      createdAt: new Date(),
      chatroom: { userId: 1n },
    });

    await service.extractOlderMessage(1);

    expect(mockMemoryExtractionPort.extract).not.toHaveBeenCalled();
    expect(mockPrismaService.memory.upsert).not.toHaveBeenCalled();
  });

  it('skips when memories already exist for the source message', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 22n,
      sender: 'user',
      content: 'older user message',
      createdAt: new Date(),
      chatroom: { userId: 7n },
    });
    mockPrismaService.memory.findFirst.mockResolvedValue({ id: 99n });

    await service.extractOlderMessage(1);

    expect(mockMemoryExtractionPort.extract).not.toHaveBeenCalled();
    expect(mockPrismaService.memory.upsert).not.toHaveBeenCalled();
  });

  it('upserts each extracted memory above the confidence threshold', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 23n,
      sender: 'user',
      content: 'I prefer casual tone in chats.',
      createdAt: new Date(),
      chatroom: { userId: 7n },
    });
    mockPrismaService.memory.findFirst.mockResolvedValue(null);
    mockPrismaService.message.findMany.mockResolvedValue([
      { sender: 'user', content: 'hi' },
    ]);
    mockMemoryExtractionPort.extract.mockResolvedValue([
      {
        kind: 'preference',
        key: 'preferred_tone',
        value: 'casual',
        confidence: 0.9,
      },
      {
        kind: 'fact',
        key: 'shaky_fact',
        value: 'maybe',
        confidence: 0.2,
      },
    ]);

    await service.extractOlderMessage(1);

    expect(mockPrismaService.memory.upsert).toHaveBeenCalledTimes(1);
    const callArg = mockPrismaService.memory.upsert.mock.calls[0][0] as {
      where: unknown;
      update: { value: string; sourceMessageId: bigint };
      create: { kind: string; key: string; userId: bigint; chatroomId: bigint };
    };
    expect(callArg.where).toEqual({
      chatroomId_kind_key: {
        chatroomId: 1n,
        kind: 'preference',
        key: 'preferred_tone',
      },
    });
    expect(callArg.update.value).toBe('casual');
    expect(callArg.update.sourceMessageId).toBe(23n);
    expect(callArg.create.userId).toBe(7n);
    expect(callArg.create.chatroomId).toBe(1n);
  });

  it('passes recent context (excluding the older message itself) to the extractor', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue({
      id: 30n,
      sender: 'user',
      content: 'older message',
      createdAt: new Date(),
      chatroom: { userId: 5n },
    });
    mockPrismaService.memory.findFirst.mockResolvedValue(null);
    mockPrismaService.message.findMany.mockResolvedValue([
      { sender: 'ai', content: 'hello there' },
      { sender: 'user', content: 'hi' },
    ]);
    mockMemoryExtractionPort.extract.mockResolvedValue([]);

    await service.extractOlderMessage(1);

    const findManyArgs = mockPrismaService.message.findMany.mock
      .calls[0][0] as { where: { id: { not: bigint } } };
    expect(findManyArgs.where.id.not).toBe(30n);
    const extractArgs = mockMemoryExtractionPort.extract.mock.calls[0][0] as {
      content: string;
      recentContext: string;
    };
    expect(extractArgs.content).toBe('older message');
    expect(extractArgs.recentContext).toContain('USER: hi');
    expect(extractArgs.recentContext).toContain('AI: hello there');
  });

  it('returns silently when no older message exists', async () => {
    mockPrismaService.message.findFirst.mockResolvedValue(null);

    await service.extractOlderMessage(1);

    expect(mockMemoryExtractionPort.extract).not.toHaveBeenCalled();
  });
});
