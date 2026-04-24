import { Test, TestingModule } from '@nestjs/testing';
import { MessageHistoryService } from './message-history.service';
import { MessagesRepository } from './messages.repository';
import type { Message } from '@prisma/client';

describe('MessageHistoryService', () => {
  let service: MessageHistoryService;
  const mockRepo = { findHistory: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageHistoryService,
        { provide: MessagesRepository, useValue: mockRepo },
      ],
    }).compile();

    service = module.get<MessageHistoryService>(MessageHistoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('reverses prisma order and serializes ids as strings', async () => {
    const rows: Message[] = [
      {
        id: 2n,
        chatroomId: 1n,
        sender: 'user',
        content: 'second',
        createdAt: new Date('2020-01-02'),
      } as Message,
      {
        id: 1n,
        chatroomId: 1n,
        sender: 'user',
        content: 'first',
        createdAt: new Date('2020-01-01'),
      } as Message,
    ];
    mockRepo.findHistory.mockResolvedValue(rows);

    const result = await service.findHistory(1, 10, 0);

    expect(mockRepo.findHistory).toHaveBeenCalledWith(1n, 10, 0);
    expect(result.map((m) => m.id)).toEqual(['1', '2']);
    expect(result.map((m) => m.content)).toEqual(['first', 'second']);
  });
});
