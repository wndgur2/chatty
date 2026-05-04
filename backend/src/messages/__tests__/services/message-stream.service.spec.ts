import { Test, TestingModule } from '@nestjs/testing';
import { MessageStreamService } from '../../services/message-stream.service';
import { MessagesGateway } from '../../gateways/messages.gateway';

describe('MessageStreamService', () => {
  let service: MessageStreamService;
  const mockGateway = {
    emitTypingState: jest.fn(),
    streamChunkToRoom: jest.fn(),
    streamEndToRoom: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessageStreamService,
        { provide: MessagesGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<MessageStreamService>(MessageStreamService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('setTyping forwards to gateway', () => {
    service.setTyping(3, true);
    expect(mockGateway.emitTypingState).toHaveBeenCalledWith(3, true);
  });

  it('streamChunk forwards to gateway', () => {
    service.streamChunk(1, 'abc');
    expect(mockGateway.streamChunkToRoom).toHaveBeenCalledWith(1, 'abc');
  });

  it('streamComplete converts messageId to number for gateway', () => {
    service.streamComplete(2, 'full', '99');
    expect(mockGateway.streamEndToRoom).toHaveBeenCalledWith(2, 'full', 99);
  });
});
