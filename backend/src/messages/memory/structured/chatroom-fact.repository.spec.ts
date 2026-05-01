import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { ChatroomFactRepository } from './chatroom-fact.repository';

describe('ChatroomFactRepository', () => {
  let repository: ChatroomFactRepository;

  const mockPrisma = {
    $transaction: jest.fn(),
    chatroomFact: {
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: unknown) => {
      return (fn as (tx: typeof mockPrisma) => Promise<void>)(mockPrisma);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatroomFactRepository,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, fallback: number) => {
              if (key === 'MEMORY_EXTRACTOR_MIN_CONFIDENCE') {
                return 0.4;
              }
              return fallback;
            }),
          },
        },
      ],
    }).compile();

    repository = module.get<ChatroomFactRepository>(ChatroomFactRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('upserts set ops using chatroomId+key unique selector', async () => {
    await repository.applyOps(7, [
      {
        op: 'set',
        key: 'task_status',
        value: 'in_progress',
        valueType: 'string',
        confidence: 0.92,
      },
      {
        op: 'set',
        key: 'task_status',
        value: 'done',
        valueType: 'string',
        confidence: 0.95,
      },
    ]);

    expect(mockPrisma.chatroomFact.upsert).toHaveBeenCalledTimes(2);
    expect(mockPrisma.chatroomFact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          chatroomId_key: {
            chatroomId: 7n,
            key: 'task_status',
          },
        },
      }),
    );
  });

  it('deletes facts for delete ops', async () => {
    await repository.applyOps(5, [
      {
        op: 'delete',
        key: 'user_preference.tone',
        confidence: 0.9,
      },
    ]);

    expect(mockPrisma.chatroomFact.deleteMany).toHaveBeenCalledWith({
      where: { chatroomId: 5n, key: 'user_preference.tone' },
    });
    expect(mockPrisma.chatroomFact.upsert).not.toHaveBeenCalled();
  });

  it('skips low-confidence and malformed ops', async () => {
    await repository.applyOps(3, [
      {
        op: 'set',
        key: 'current_project',
        value: 'chatty',
        valueType: 'string',
        confidence: 0.2,
      },
      {
        op: 'set',
        key: 'missing_value_type',
        value: 'x',
        confidence: 0.8,
      },
      {
        op: 'set',
        key: 'missing_value',
        valueType: 'string',
        confidence: 0.8,
      },
    ]);

    expect(mockPrisma.chatroomFact.upsert).not.toHaveBeenCalled();
    expect(mockPrisma.chatroomFact.deleteMany).not.toHaveBeenCalled();
  });

  it('filters by min confidence when fetching facts', async () => {
    mockPrisma.chatroomFact.findMany.mockResolvedValue([]);

    await repository.findAllForChatroom(9, { minConfidence: 0.5 });

    expect(mockPrisma.chatroomFact.findMany).toHaveBeenCalledWith({
      where: { chatroomId: 9n, confidence: { gte: 0.5 } },
      orderBy: [{ key: 'asc' }],
    });
  });
});
