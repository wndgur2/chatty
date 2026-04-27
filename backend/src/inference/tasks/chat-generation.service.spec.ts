import { Test, TestingModule } from '@nestjs/testing';
import { ChatGenerationService } from './chat-generation.service';
import {
  CHAT_COMPLETION_PORT,
  ChatCompletionPort,
} from '../ports/chat-completion.port';

async function* mockStream(chunks: { delta: string }[]) {
  for (const c of chunks) {
    yield c;
  }
}

describe('ChatGenerationService', () => {
  let service: ChatGenerationService;
  const streamMock: jest.MockedFunction<ChatCompletionPort['stream']> =
    jest.fn();
  const mockChatCompletionPort: ChatCompletionPort = {
    stream: streamMock,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGenerationService,
        { provide: CHAT_COMPLETION_PORT, useValue: mockChatCompletionPort },
      ],
    }).compile();

    service = module.get<ChatGenerationService>(ChatGenerationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('concatenates streamed chunks and invokes onChunk', async () => {
    streamMock.mockReturnValue(
      mockStream([{ delta: 'hel' }, { delta: 'lo' }, { delta: '' }]),
    );
    const onChunk = jest.fn();

    const full = await service.generate(
      [{ role: 'user', content: 'hi' }],
      'sys',
      onChunk,
    );

    expect(full).toBe('hello');
    expect(onChunk).toHaveBeenCalledWith('hel');
    expect(onChunk).toHaveBeenCalledWith('hello');
    expect(streamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [{ role: 'user', content: 'hi' }],
        systemPrompt: 'sys',
      }),
    );
  });

  it('passes proactive decoding options when proactive option is true', async () => {
    streamMock.mockReturnValue(mockStream([{ delta: 'x' }]));

    await service.generate([], 'prompt', undefined, { proactive: true });

    expect(streamMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [],
        systemPrompt: 'prompt',
        decoding: {
          temperature: 0.4,
          repeat_penalty: 1.12,
          num_predict: 140,
        },
      }),
    );
  });
});
