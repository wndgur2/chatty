import { Test, TestingModule } from '@nestjs/testing';
import { MessagesRepository } from './messages.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('MessagesRepository', () => {
  let repository: MessagesRepository;
  const mockPrisma = {
    message: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<MessagesRepository>(MessagesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('findHistory delegates to prisma with ordering and pagination', async () => {
    mockPrisma.message.findMany.mockResolvedValue([]);
    await repository.findHistory(9n, 20, 5);
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
      where: { chatroomId: 9n },
      orderBy: { createdAt: 'desc' },
      take: 20,
      skip: 5,
    });
  });

  it('findRecent delegates to prisma', async () => {
    mockPrisma.message.findMany.mockResolvedValue([]);
    await repository.findRecent(1n, 10);
    expect(mockPrisma.message.findMany).toHaveBeenCalledWith({
      where: { chatroomId: 1n },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  });

  it('createMessage for user omits aiMessageMetadata', async () => {
    mockPrisma.message.create.mockResolvedValue({ id: 1n });
    await repository.createMessage(2n, 'user', 'hello');
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: {
        chatroom: { connect: { id: 2n } },
        sender: 'user',
        content: 'hello',
        aiMessageMetadata: undefined,
      },
    });
  });

  it('createMessage for ai includes metadata and triggerContext when set', async () => {
    mockPrisma.message.create.mockResolvedValue({ id: 2n });
    await repository.createMessage(2n, 'ai', 'reply', {
      deliveryMode: 'reply',
      triggerReason: 'user_message',
      triggerContext: { key: 'v' },
      readAt: null,
    });
    expect(mockPrisma.message.create).toHaveBeenCalledWith({
      data: {
        chatroom: { connect: { id: 2n } },
        sender: 'ai',
        content: 'reply',
        aiMessageMetadata: {
          create: {
            readAt: null,
            deliveryMode: 'reply',
            triggerReason: 'user_message',
            triggerContext: { key: 'v' },
          },
        },
      },
    });
  });

  it('createMessage for ai omits triggerContext key when null', async () => {
    mockPrisma.message.create.mockResolvedValue({ id: 3n });
    await repository.createMessage(2n, 'ai', 'hi', {
      deliveryMode: 'reply',
      triggerReason: 'scheduled',
      triggerContext: null,
    });
    const createCalls = mockPrisma.message.create.mock
      .calls as unknown as Array<
      [
        {
          data: {
            aiMessageMetadata: { create: Record<string, unknown> };
          };
        },
      ]
    >;
    const createArg = createCalls[0][0];
    expect(createArg.data.aiMessageMetadata.create).not.toHaveProperty(
      'triggerContext',
    );
  });
});
