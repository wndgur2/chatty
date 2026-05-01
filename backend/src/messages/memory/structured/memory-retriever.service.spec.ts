import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { STRUCTURED_STATE_PROMPT } from '../../../inference/prompts/chat-system.prompt';
import { ChatroomFactRepository } from './chatroom-fact.repository';
import { MemoryRetrieverService } from './memory-retriever.service';

const mockChatroomFactRepository = {
  findAllForChatroom: jest.fn(),
};

const mockConfigService = {
  get: jest.fn((_: string, fallback: number) => fallback),
};

describe('MemoryRetrieverService', () => {
  let service: MemoryRetrieverService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryRetrieverService,
        {
          provide: ChatroomFactRepository,
          useValue: mockChatroomFactRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MemoryRetrieverService>(MemoryRetrieverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((_: string, fallback: number) => fallback);
  });

  it('returns empty string when no facts exist', async () => {
    mockChatroomFactRepository.findAllForChatroom.mockResolvedValue([]);

    const result = await service.getStateBlock(11);

    expect(result).toBe('');
  });

  it('formats deterministic state block with prompt and facts', async () => {
    mockChatroomFactRepository.findAllForChatroom.mockResolvedValue([
      {
        key: 'current_project',
        value: 'Chatty MVP',
      },
      {
        key: 'task_status',
        value: 'in_progress',
      },
      {
        key: 'user_preference.tone',
        value: 'concise',
      },
    ]);

    const result = await service.getStateBlock(12);

    expect(result).toBe(
      `${STRUCTURED_STATE_PROMPT}\n- current_project: "Chatty MVP"\n- task_status: "in_progress"\n- user_preference.tone: "concise"`,
    );
  });

  it('uses configured minimum confidence filter when loading facts', async () => {
    mockConfigService.get.mockImplementation((key: string, fallback: number) =>
      key === 'MEMORY_RETRIEVER_MIN_CONFIDENCE' ? 0.8 : fallback,
    );
    mockChatroomFactRepository.findAllForChatroom.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryRetrieverService,
        {
          provide: ChatroomFactRepository,
          useValue: mockChatroomFactRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();
    const serviceWithConfig = module.get<MemoryRetrieverService>(
      MemoryRetrieverService,
    );

    await serviceWithConfig.getStateBlock(13);

    expect(mockChatroomFactRepository.findAllForChatroom).toHaveBeenCalledWith(13, {
      minConfidence: 0.8,
    });
  });
});
