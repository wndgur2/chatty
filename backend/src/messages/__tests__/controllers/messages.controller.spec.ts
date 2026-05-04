import { Test, TestingModule } from '@nestjs/testing';
import { MessagesController } from '../../controllers/messages.controller';
import { MessagesService } from '../../services/messages.service';

const mockMessagesService = {
  findHistory: jest.fn(),
  sendToAI: jest.fn(),
};

describe('MessagesController', () => {
  let controller: MessagesController;
  const authUser = { userId: '1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [{ provide: MessagesService, useValue: mockMessagesService }],
    }).compile();

    controller = module.get<MessagesController>(MessagesController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return message history', async () => {
    const result = [{ id: 1, content: 'Hello' }];
    mockMessagesService.findHistory.mockResolvedValue(result);

    expect(
      await controller.findHistory(authUser, 1, { limit: 10, offset: 0 }),
    ).toBe(result);
    expect(mockMessagesService.findHistory).toHaveBeenCalledWith('1', 1, 10, 0);
  });

  it('should trigger AI message processing', async () => {
    const dto = { content: 'Tell me a joke.' };
    const result = {
      messageId: 103,
      status: 'processing',
      message: {
        id: '103',
        chatroomId: '1',
        sender: 'user',
        content: 'Tell me a joke.',
        createdAt: '2026-04-27T00:00:00.000Z',
      },
    };
    mockMessagesService.sendToAI.mockResolvedValue(result);

    expect(await controller.sendToAI(authUser, 1, dto)).toBe(result);
    expect(mockMessagesService.sendToAI).toHaveBeenCalledWith('1', 1, dto);
  });
});
