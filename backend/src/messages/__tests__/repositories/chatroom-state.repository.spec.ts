import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomStateRepository } from '../../repositories/chatroom-state.repository';
import { PrismaService } from '../../../prisma/prisma.service';
import { INITIAL_AI_EVALUATION_DELAY_SECONDS } from '../../../tasks/constants/scheduling.constants';

describe('ChatroomStateRepository', () => {
  let repository: ChatroomStateRepository;
  const mockPrisma = {
    chatroom: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatroomStateRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ChatroomStateRepository>(ChatroomStateRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findById queries chatroom by id', async () => {
    await repository.findById(8n);
    expect(mockPrisma.chatroom.findUnique).toHaveBeenCalledWith({
      where: { id: 8n },
    });
  });

  it('findByIdAndUser queries id and userId', async () => {
    await repository.findByIdAndUser(1n, 2n);
    expect(mockPrisma.chatroom.findFirst).toHaveBeenCalledWith({
      where: { id: 1n, userId: 2n },
    });
  });

  it('clearNextEvaluationTime nulls nextEvaluationTime', async () => {
    await repository.clearNextEvaluationTime(3n);
    expect(mockPrisma.chatroom.update).toHaveBeenCalledWith({
      where: { id: 3n },
      data: { nextEvaluationTime: null },
    });
  });

  it('resetDelay sets initial delay and future nextEvaluationTime', async () => {
    const before = Date.now();
    await repository.resetDelay(4n);
    const after = Date.now();

    const updateCalls = mockPrisma.chatroom.update.mock
      .calls as unknown as Array<
      [
        {
          where: { id: bigint };
          data: { currentDelaySeconds: number; nextEvaluationTime: Date };
        },
      ]
    >;
    const updateArg = updateCalls[0][0];
    expect(updateArg.where).toEqual({ id: 4n });
    expect(updateArg.data.currentDelaySeconds).toBe(
      INITIAL_AI_EVALUATION_DELAY_SECONDS,
    );
    const next = updateArg.data.nextEvaluationTime;
    expect(next).toBeInstanceOf(Date);
    const minExpected = before + INITIAL_AI_EVALUATION_DELAY_SECONDS * 1000;
    const maxExpected = after + INITIAL_AI_EVALUATION_DELAY_SECONDS * 1000;
    expect(next.getTime()).toBeGreaterThanOrEqual(minExpected - 500);
    expect(next.getTime()).toBeLessThanOrEqual(maxExpected + 500);
  });
});
