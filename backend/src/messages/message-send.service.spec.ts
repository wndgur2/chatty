import { Test, TestingModule } from '@nestjs/testing';
import { MessageSendService } from './message-send.service';
import { MessagesRepository } from './messages.repository';

describe('MessageSendService', () => {
  let service: MessageSendService;
  const mockMessagesRepository = {
    createMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageSendService,
        { provide: MessagesRepository, useValue: mockMessagesRepository },
      ],
    }).compile();

    service = module.get<MessageSendService>(MessageSendService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('stores user message without AI metadata payload', async () => {
    mockMessagesRepository.createMessage.mockResolvedValue({
      id: 10n,
      chatroomId: 1n,
      sender: 'user',
      content: 'hello',
      createdAt: new Date('2026-04-24T00:00:00.000Z'),
    });

    await service.saveUserMessage(1, { content: 'hello' });

    expect(mockMessagesRepository.createMessage).toHaveBeenCalledWith(
      1n,
      'user',
      'hello',
    );
  });
});
