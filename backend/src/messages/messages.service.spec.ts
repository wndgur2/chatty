import { Test, TestingModule } from '@nestjs/testing';
import { MessagesService } from './messages.service';
import { MessageHistoryService } from './message-history.service';
import { MessageSendService } from './message-send.service';
import { MessageStreamService } from './message-stream.service';
import { AiResponseService } from './ai-response.service';
import { MessagesRepository } from './messages.repository';
import { ChatroomStateRepository } from './chatroom-state.repository';
import { FcmPushService } from '../notifications/fcm-push.service';
import {
  NORMAL_CHAT_BASE_SYSTEM,
  STABLE_VOLUNTARY_ALIGNMENT,
} from '../ai-evaluation.constants';

const mockMessageHistoryService = { findHistory: jest.fn() };
const mockMessageSendService = { saveUserMessage: jest.fn() };
const mockMessageStreamService = {
  setTyping: jest.fn(),
  streamChunk: jest.fn(),
  streamComplete: jest.fn(),
};
const mockAiResponseService = { generate: jest.fn() };
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
  notifyVoluntaryAiMessage: jest.fn().mockResolvedValue(undefined),
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
        { provide: AiResponseService, useValue: mockAiResponseService },
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

  it('should notify FCM after a voluntary background message completes', async () => {
    mockChatroomStateRepository.findById.mockResolvedValue({
      id: 1n,
      userId: 2n,
      name: 'Voluntary Room',
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
    mockAiResponseService.generate.mockResolvedValue('AI reply text');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 42n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);

    await service.processBackgroundMessage(1, true);

    expect(mockAiResponseService.generate).toHaveBeenCalled();
    const genArgs = mockAiResponseService.generate.mock.calls[0] as [
      { role: string; content: string }[],
      string,
      (chunk: string) => void,
      { voluntary?: boolean } | undefined,
    ];
    expect(genArgs[0][0]).toEqual({ role: 'user', content: 'hi' });
    expect(genArgs[0][1].role).toBe('system');
    expect(genArgs[0][1].content).toContain('Voluntary = short');
    expect(genArgs[0][1].content).toContain('hi');
    expect(genArgs[1]).toBe(`be brief\n\n${STABLE_VOLUNTARY_ALIGNMENT}`);
    expect(genArgs[3]).toEqual({ voluntary: true });
    expect(mockFcmPushService.notifyVoluntaryAiMessage).toHaveBeenCalledWith(
      2n,
      expect.objectContaining({
        chatroomId: '1',
        chatroomName: 'Voluntary Room',
        messagePreview: 'AI reply text',
      }),
    );
  });

  it('should prepend normal base system prompt for non-voluntary background messages', async () => {
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
    mockAiResponseService.generate.mockResolvedValue('reply');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);

    await service.processBackgroundMessage(1, false);

    expect(mockAiResponseService.generate).toHaveBeenCalledWith(
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
    mockAiResponseService.generate.mockResolvedValue('ok');
    mockMessagesRepository.createMessage.mockResolvedValue({ id: 1n });
    mockChatroomStateRepository.resetDelay.mockResolvedValue(undefined);

    await service.processBackgroundMessage(1, false);

    expect(mockAiResponseService.generate).toHaveBeenCalledWith(
      [{ role: 'user', content: 'hey' }],
      NORMAL_CHAT_BASE_SYSTEM,
      expect.any(Function),
      undefined,
    );
  });
});
