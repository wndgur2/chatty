import { Test, TestingModule } from '@nestjs/testing';
import { TasksService } from './tasks.service';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { ProactiveEvaluatorService } from '../inference/tasks/proactive-evaluator.service';
describe('TasksService', () => {
  let service: TasksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: PrismaService,
          useValue: {
            chatroom: {
              findMany: jest.fn().mockResolvedValue([]),
              update: jest.fn(),
            },
            message: {
              findMany: jest.fn().mockResolvedValue([]),
            },
          },
        },
        {
          provide: ProactiveEvaluatorService,
          useValue: {
            shouldAnswer: jest.fn().mockResolvedValue(true),
          },
        },
        {
          provide: MessagesService,
          useValue: {
            processBackgroundMessage: jest.fn().mockResolvedValue(true),
          },
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('backs off without Ollama or proactive AI when proactive streak is at cap', async () => {
    const shouldAnswer = jest.fn();
    const processBackgroundMessage = jest.fn();
    const chatroomUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      chatroom: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            currentDelaySeconds: 60,
            basePrompt: null as string | null,
          },
        ]),
        update: chatroomUpdate,
      },
      message: {
        findMany: jest
          .fn()
          .mockResolvedValue([
            { sender: 'ai' as const },
            { sender: 'ai' as const },
            { sender: 'ai' as const },
            { sender: 'ai' as const },
            { sender: 'user' as const },
          ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProactiveEvaluatorService, useValue: { shouldAnswer } },
        { provide: MessagesService, useValue: { processBackgroundMessage } },
      ],
    }).compile();

    const svc = module.get<TasksService>(TasksService);
    await svc.handleAIBackgroundEvaluations();

    expect(shouldAnswer).not.toHaveBeenCalled();
    expect(processBackgroundMessage).not.toHaveBeenCalled();

    type RoomUpdateArg = {
      data?: { currentDelaySeconds?: number; nextEvaluationTime?: Date };
    };
    const updateCalls = chatroomUpdate.mock.calls as [RoomUpdateArg][];
    const backoffCall = updateCalls.find(
      (call) => call[0]?.data?.currentDelaySeconds === 60 * 2,
    );
    expect(backoffCall).toBeDefined();
    expect(backoffCall?.[0].data?.nextEvaluationTime).toBeInstanceOf(Date);
  });

  it('still evaluates when proactive streak is below cap', async () => {
    const shouldAnswer = jest.fn().mockResolvedValue(true);
    const processBackgroundMessage = jest.fn().mockResolvedValue(undefined);
    const chatroomUpdate = jest.fn().mockResolvedValue({});
    const prisma = {
      chatroom: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 1n,
            currentDelaySeconds: 60,
            basePrompt: 'p',
          },
        ]),
        update: chatroomUpdate,
      },
      message: {
        findMany: jest.fn().mockResolvedValue([
          {
            sender: 'ai' as const,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
          {
            sender: 'ai' as const,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
          {
            sender: 'user' as const,
            createdAt: new Date('2026-01-01T00:00:00Z'),
          },
        ]),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: PrismaService, useValue: prisma },
        { provide: ProactiveEvaluatorService, useValue: { shouldAnswer } },
        { provide: MessagesService, useValue: { processBackgroundMessage } },
      ],
    }).compile();

    const svc = module.get<TasksService>(TasksService);
    await svc.handleAIBackgroundEvaluations();

    expect(shouldAnswer).toHaveBeenCalled();
    expect(processBackgroundMessage).toHaveBeenCalledWith(1, true);
  });
});
