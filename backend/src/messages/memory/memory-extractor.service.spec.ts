import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
  MEMORY_EXTRACTION_PORT,
  MemoryExtractionPort,
} from '../../inference/ports/memory-extraction.port';
import { MemoryExtractorService } from './memory-extractor.service';

describe('MemoryExtractorService', () => {
  let service: MemoryExtractorService;

  const mockPrisma = {
    message: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    memory: {
      findFirst: jest.fn(),
      upsert: jest.fn(),
    },
  };

  const extractMock: jest.MockedFunction<MemoryExtractionPort['extract']> =
    jest.fn();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryExtractorService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: MEMORY_EXTRACTION_PORT,
          useValue: {
            extract: extractMock,
          } satisfies MemoryExtractionPort,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback?: string | number) => {
              if (key === 'RAG_RECENT_WINDOW') return 8;
              if (key === 'MEMORY_MIN_CONFIDENCE') return 0.8;
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<MemoryExtractorService>(MemoryExtractorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('upserts extracted memories for eligible older user message', async () => {
    mockPrisma.message.findFirst.mockResolvedValue({
      id: 12n,
      sender: 'user',
      content: 'I prefer casual tone and my current project is Chatty.',
      chatroomId: 7n,
      chatroom: { userId: 9n },
    });
    mockPrisma.memory.findFirst.mockResolvedValue(null);
    mockPrisma.message.findMany.mockResolvedValue([
      { sender: 'user', content: 'latest msg 1' },
      { sender: 'ai', content: 'latest msg 2' },
    ]);
    extractMock.mockResolvedValue([
      {
        kind: 'preference',
        key: 'tone',
        value: 'casual',
        confidence: 0.95,
      },
      {
        kind: 'project_state',
        key: 'current_project',
        value: 'Chatty',
        confidence: 0.91,
      },
    ]);

    await service.extractOlderMessage(7);

    expect(extractMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'I prefer casual tone and my current project is Chatty.',
      }),
    );
    expect(mockPrisma.memory.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.memory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          chatroomId_kind_key: {
            chatroomId: 7n,
            kind: 'preference',
            key: 'tone',
          },
        },
      }),
    );
  });

  it('skips extraction when source message already processed', async () => {
    mockPrisma.message.findFirst.mockResolvedValue({
      id: 33n,
      sender: 'user',
      content: 'old',
      chatroomId: 1n,
      chatroom: { userId: 2n },
    });
    mockPrisma.memory.findFirst.mockResolvedValue({ id: 1n });

    await service.extractOlderMessage(1);

    expect(extractMock).not.toHaveBeenCalled();
    expect(mockPrisma.memory.upsert).not.toHaveBeenCalled();
  });

  it('ignores extracted memories below confidence threshold', async () => {
    mockPrisma.message.findFirst.mockResolvedValue({
      id: 40n,
      sender: 'user',
      content: 'note',
      chatroomId: 5n,
      chatroom: { userId: 3n },
    });
    mockPrisma.memory.findFirst.mockResolvedValue(null);
    mockPrisma.message.findMany.mockResolvedValue([]);
    extractMock.mockResolvedValue([
      {
        kind: 'fact',
        key: 'timezone',
        value: 'UTC+9',
        confidence: 0.4,
      },
    ]);

    await service.extractOlderMessage(5);

    expect(mockPrisma.memory.upsert).not.toHaveBeenCalled();
  });
});
