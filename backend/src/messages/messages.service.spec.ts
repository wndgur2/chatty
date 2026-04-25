import { ForbiddenException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessageHistoryService } from './message-history.service';
import { MessageSendService } from './message-send.service';
import { MessageStreamService } from './message-stream.service';
import { MessagesRepository } from './messages.repository';
import { ChatroomStateRepository } from './chatroom-state.repository';
import { FcmPushService } from '../notifications/fcm-push.service';
import {
  NORMAL_CHAT_BASE_SYSTEM,
  STABLE_VOLUNTARY_ALIGNMENT,
} from '../inference/prompts/chat-system.prompt';
import { ChatGenerationService } from '../inference/tasks/chat-generation.service';

const mockMessageHistoryService = { findHistory: jest.fn() };
const mockMessageSendService = { saveUserMessage: jest.fn() };
const mockMessageStreamService = {
  setTyping: jest.fn(),
  streamChunk: jest.fn(),
  streamComplete: jest.fn(),
};
const mockChatGenerationService = { generate: jest.fn() };
const mockMessagesRepository = {
  createMessage: jest.fn(),
  findRecent: jest.fn(),
};
const mockChatroomStateRepository = {
  clearNextEvaluationTime: jest.fn(),
  resetDelay: jest.fn(),
  findByIdAndUser: jest.fn(),
  findById: jest.fn(),
};
const mockFcmPushService = {
  notifyProactiveAiMessage: jest.fn().mockResolvedValue(undefined),
};

describe('MessagesService', () => {
  let service: MessagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: MessageHistoryService, useValue: mockMessageHistoryService },
        { provide: MessageSendService, useValue: mockMessageSendService },
        { provide: MessageStreamService, useValue: mockMessageStreamService },
        {
          provide: ChatGenerationService,
          useValue: mockChatGenerationService,
        },
        { provide: MessagesRepository, useValue: mockMessagesRepository },
        {
          provide: ChatroomStateRepository,
          useValue: mockChatroomStateRepository,
        },
        { provide: FcmPushService, useValue: mockFcmPushService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockFcmPushService.notifyProactiveAiMessage.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find message history', async () => {
    const mockResult = [{ id: 1n, content: 'Hello' }];
    mockMessageHistoryService.findHistory.mockResolvedValue(mockResult);
    mockChatroomStateRepository.findByIdAndUser.mockResolvedValue({ id: 1n });

    const result = await service.findHistory('1', 1, 10, 0);
    expect(result).toEqual(mockResult);
    expect(mockMessageHistoryService.findHistory).toHaveBeenCalledWith(
      1,
      10,
      0,
    );
  });

  it('should reject findHistory when user does not own chatroom', async () => {
    mockChatroomStateRepository.findByIdAndUser.mockResolvedValue(null);

    await expect(service.findHistory('1', 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(mockMessageHistoryService.findHistory).not.toHaveBeenCalled();
  });

  it('should send a message to AI and process background stream', async () => {
    const mockCreatedMessage = { id: '103' };
    mockMessageSendService.saveUserMessage.mockResolvedValue(
      mockCreatedMessage,
    );
    mockChatroomStateRepository.findByIdAndUser.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.clearNextEvaluationTime.mockResolvedValue(
      undefined,
    );

    const dto = { content: 'Tell me a joke.' };

    // Let's spy on processBackgroundMessage by ignoring errors since it runs async
    const processMock = jest
      .spyOn(service as any, 'processBackgroundMessage')
      .mockResolvedValue(undefined);

    const result = await service.sendToAI('1', 1, dto);

    expect(result).toEqual({ messageId: '103', status: 'processing' });
    expect(mockMessageSendService.saveUserMessage).toHaveBeenCalled();
    expect(
      mockChatroomStateRepository.clearNextEvaluationTime,
    ).toHaveBeenCalledWith(1n);
    expect(processMock).toHaveBeenCalledWith(1);

    processMock.mockRestore();
  });

  it('should log when background processing rejects after sendToAI', async () => {
    const errSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    mockChatroomStateRepository.findByIdAndUser.mockResolvedValue({ id: 1n });
    mockMessageSendService.saveUserMessage.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.clearNextEvaluationTime.mockResolvedValue(
      undefined,
    );
    jest
      .spyOn(service, 'processBackgroundMessage')
      .mockRejectedValue(new Error('bg fail'));

    await service.sendToAI('1', 1, { content: 'x' });
    await new Promise((r) => setImmediate(r));

    expect(errSpy).toHaveBeenCalledWith(
      'Background processing failed',
      expect.any(Error),
    );
    errSpy.mockRestore();
  });

  it('should no-op processBackgroundMessage when chatroom is missing', async () => {
    mockChatroomStateRepository.findById.mockResolvedValue(null);

    await service.processBackgroundMessage(99, false);

    expect(mockChatGenerationService.generate).not.toHaveBeenCalled();
  });

  it('should warn when proactive FCM notify fails', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    mockChatroomStateRepository.findById.mockResolvedValue({
      id: 1n,
      userId: 2n,
      name: 'Room',
      basePrompt: '',
    });
    mockMessagesRepository.findRecent.mockResolvedValue([
      {
        id: 1n,
        chatroomId: 1n,
        sender: 'user',
        content: 'hi',
        createdAt: new Date(),
      },
    ]);
    mockChatGenerationService.generate.mockResolvedValue('done');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);
    mockFcmPushService.notifyProactiveAiMessage.mockRejectedValue(
      new Error('fcm down'),
    );

    await service.processBackgroundMessage(1, true);

    expect(warnSpy).toHaveBeenCalledWith(
      'FCM proactive message notify failed',
      expect.any(Error),
    );
    warnSpy.mockRestore();
  });

  it('should stop typing and reset delay when AI generation throws', async () => {
    const errSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    mockChatroomStateRepository.findById.mockResolvedValue({
      id: 1n,
      userId: 2n,
      name: 'Room',
      basePrompt: '',
    });
    mockMessagesRepository.findRecent.mockResolvedValue([]);
    mockChatGenerationService.generate.mockRejectedValue(new Error('ollama'));

    await service.processBackgroundMessage(3, false);

    expect(mockMessageStreamService.setTyping).toHaveBeenCalledWith(3, false);
    expect(mockChatroomStateRepository.resetDelay).toHaveBeenCalledWith(3n);
    expect(errSpy).toHaveBeenCalledWith(
      'Error processing AI message for room 3',
      expect.any(Error),
    );
    errSpy.mockRestore();
  });

  it('should notify FCM after a proactive background message completes', async () => {
    mockChatroomStateRepository.findById.mockResolvedValue({
      id: 1n,
      userId: 2n,
      name: 'Proactive Room',
      basePrompt: 'be brief',
    });
    mockMessagesRepository.findRecent.mockResolvedValue([
      {
        id: 1n,
        chatroomId: 1n,
        sender: 'user',
        content: 'hi',
        createdAt: new Date(),
      },
    ]);
    mockChatGenerationService.generate.mockResolvedValue('AI reply text');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 42n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);

    await service.processBackgroundMessage(1, true);

    expect(mockChatGenerationService.generate).toHaveBeenCalled();
    expect(mockMessagesRepository.createMessage).toHaveBeenCalledWith(
      1n,
      'ai',
      'AI reply text',
      expect.objectContaining({
        deliveryMode: 'proactive',
        triggerReason: 'scheduler_evaluation_yes',
      }),
    );
    const genArgs = mockChatGenerationService.generate.mock.calls[0] as [
      { role: string; content: string }[],
      string,
      (chunk: string) => void,
      { proactive?: boolean } | undefined,
    ];
    expect(genArgs[0][0]).toEqual({ role: 'user', content: 'hi' });
    expect(genArgs[0][1].role).toBe('system');
    expect(genArgs[0][1].content).toContain('Proactive = short');
    expect(genArgs[0][1].content).toContain('hi');
    expect(genArgs[1]).toBe(`be brief\n\n${STABLE_VOLUNTARY_ALIGNMENT}`);
    expect(genArgs[3]).toEqual({ proactive: true });
    expect(mockFcmPushService.notifyProactiveAiMessage).toHaveBeenCalledWith(
      2n,
      expect.objectContaining({
        chatroomId: '1',
        chatroomName: 'Proactive Room',
        messagePreview: 'AI reply text',
      }),
    );
  });

  it('should prepend normal base system prompt for non-proactive background messages', async () => {
    mockChatroomStateRepository.findById.mockResolvedValue({
      id: 1n,
      userId: 2n,
      name: 'Room',
      basePrompt: 'You are helpful.',
    });
    mockMessagesRepository.findRecent.mockResolvedValue([
      {
        id: 1n,
        chatroomId: 1n,
        sender: 'user',
        content: 'hello',
        createdAt: new Date(),
      },
    ]);
    mockChatGenerationService.generate.mockResolvedValue('reply');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);

    await service.processBackgroundMessage(1, false);

    expect(mockMessagesRepository.createMessage).toHaveBeenCalledWith(
      1n,
      'ai',
      'reply',
      expect.objectContaining({
        deliveryMode: 'reply',
        triggerReason: 'user_request',
      }),
    );
    expect(mockChatGenerationService.generate).toHaveBeenCalledWith(
      [{ role: 'user', content: 'hello' }],
      `${NORMAL_CHAT_BASE_SYSTEM}\n\nYou are helpful.`,
      expect.any(Function),
      undefined,
    );
  });

  it('should use only the normal base system prompt when room basePrompt is empty', async () => {
    mockChatroomStateRepository.findById.mockResolvedValue({
      id: 1n,
      userId: 2n,
      name: 'Room',
      basePrompt: '',
    });
    mockMessagesRepository.findRecent.mockResolvedValue([
      {
        id: 1n,
        chatroomId: 1n,
        sender: 'user',
        content: 'hey',
        createdAt: new Date(),
      },
    ]);
    mockChatGenerationService.generate.mockResolvedValue('ok');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);

    await service.processBackgroundMessage(1, false);

    expect(mockChatGenerationService.generate).toHaveBeenCalledWith(
      [{ role: 'user', content: 'hey' }],
      NORMAL_CHAT_BASE_SYSTEM,
      expect.any(Function),
      undefined,
    );
  });
});
