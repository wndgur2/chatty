import { Test, TestingModule } from '@nestjs/testing';
import { AiResponseService } from './ai-response.service';
import { OllamaService } from '../ollama/ollama.service';

function* mockStream(chunks: { message?: { content?: string } }[]) {
  for (const c of chunks) {
    yield c;
  }
}

describe('AiResponseService', () => {
  let service: AiResponseService;
  const mockOllama = {
    streamChatResponse: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiResponseService,
        { provide: OllamaService, useValue: mockOllama },
      ],
    }).compile();

    service = module.get<AiResponseService>(AiResponseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('concatenates streamed chunks and invokes onChunk', async () => {
    mockOllama.streamChatResponse.mockResolvedValue(
      mockStream([
        { message: { content: 'hel' } },
        { message: { content: 'lo' } },
        { message: { content: '' } },
        { message: {} },
      ]),
    );
    const onChunk = jest.fn();

    const full = await service.generate(
      [{ role: 'user', content: 'hi' }],
      'sys',
      onChunk,
    );

    expect(full).toBe('hello');
    expect(onChunk).toHaveBeenCalledWith('hel');
    expect(onChunk).toHaveBeenCalledWith('lo');
    expect(mockOllama.streamChatResponse).toHaveBeenCalledWith(
      [{ role: 'user', content: 'hi' }],
      'sys',
      undefined,
    );
  });

  it('passes voluntary option to ollama', async () => {
    mockOllama.streamChatResponse.mockResolvedValue(
      mockStream([{ message: { content: 'x' } }]),
    );

    await service.generate([], 'prompt', undefined, { voluntary: true });

    expect(mockOllama.streamChatResponse).toHaveBeenCalledWith([], 'prompt', {
      voluntary: true,
    });
  });
});
