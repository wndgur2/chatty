import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import {
  buildMemoryExtractorUserPrompt,
  MEMORY_EXTRACTOR_JSON_SCHEMA,
  MEMORY_EXTRACTOR_SYSTEM,
} from '../../../inference/prompts/memory-extractor.prompt';
import { STRUCTURED_OUTPUT_PORT } from '../../../inference/ports/structured-output.port';
import { ChatroomFactRepository } from './chatroom-fact.repository';
import { MemoryExtractorService } from './memory-extractor.service';

describe('MemoryExtractorService', () => {
  let service: MemoryExtractorService;

  const mockStructuredOutputPort = {
    extract: jest.fn(),
  };
  const mockChatroomFactRepository = {
    findAllForChatroom: jest.fn(),
    applyOps: jest.fn(),
  };
  const mockConfigService = {
    get: jest.fn((key: string, fallback: number) => fallback),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryExtractorService,
        {
          provide: STRUCTURED_OUTPUT_PORT,
          useValue: mockStructuredOutputPort,
        },
        {
          provide: ChatroomFactRepository,
          useValue: mockChatroomFactRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<MemoryExtractorService>(MemoryExtractorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation(
      (key: string, fallback: number) => fallback,
    );
  });

  it('builds extractor prompt and applies normalized ops', async () => {
    const currentFacts = [
      {
        key: 'task_status',
        value: 'in_progress',
        valueType: 'string',
      },
    ];
    mockChatroomFactRepository.findAllForChatroom.mockResolvedValue([
      ...currentFacts,
    ]);
    mockStructuredOutputPort.extract.mockResolvedValue({
      ops: [
        {
          op: 'set',
          key: 'task_status',
          value: 'done',
          valueType: 'string',
          confidence: 0.9,
        },
      ],
    });
    mockChatroomFactRepository.applyOps.mockResolvedValue(undefined);

    await service.extractFromTurn({
      chatroomId: 7,
      userMessage: 'Mark this done',
      aiMessage: 'Done.',
      sourceMessageId: 55n,
    });

    const expectedUserPrompt = buildMemoryExtractorUserPrompt({
      currentFacts,
      userMessage: 'Mark this done',
      aiMessage: 'Done.',
    });

    expect(mockStructuredOutputPort.extract).toHaveBeenCalledWith({
      systemPrompt: MEMORY_EXTRACTOR_SYSTEM,
      jsonSchema: MEMORY_EXTRACTOR_JSON_SCHEMA,
      userPrompt: expectedUserPrompt,
    });
    expect(mockChatroomFactRepository.applyOps).toHaveBeenCalledWith(
      7,
      [
        {
          op: 'set',
          key: 'task_status',
          value: 'done',
          valueType: 'string',
          confidence: 0.9,
        },
      ],
      55n,
    );
  });

  it('caps operation count per turn', async () => {
    mockConfigService.get.mockImplementation(
      (key: string, fallback: number) => {
        if (key === 'MEMORY_EXTRACTOR_MAX_OPS_PER_TURN') {
          return 2;
        }
        return fallback;
      },
    );
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MemoryExtractorService,
        {
          provide: STRUCTURED_OUTPUT_PORT,
          useValue: mockStructuredOutputPort,
        },
        {
          provide: ChatroomFactRepository,
          useValue: mockChatroomFactRepository,
        },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get<MemoryExtractorService>(MemoryExtractorService);

    mockChatroomFactRepository.findAllForChatroom.mockResolvedValue([]);
    mockStructuredOutputPort.extract.mockResolvedValue({
      ops: [
        { op: 'set', key: 'a', value: '1', valueType: 'string' },
        { op: 'set', key: 'b', value: '2', valueType: 'string' },
        { op: 'set', key: 'c', value: '3', valueType: 'string' },
      ],
    });
    mockChatroomFactRepository.applyOps.mockResolvedValue(undefined);

    await service.extractFromTurn({
      chatroomId: 1,
      userMessage: 'u',
      aiMessage: 'a',
      sourceMessageId: 9n,
    });

    expect(mockChatroomFactRepository.applyOps).toHaveBeenCalledWith(
      1,
      [
        {
          op: 'set',
          key: 'a',
          value: '1',
          valueType: 'string',
          confidence: undefined,
        },
        {
          op: 'set',
          key: 'b',
          value: '2',
          valueType: 'string',
          confidence: undefined,
        },
      ],
      9n,
    );
  });

  it('returns without write when structured output is null', async () => {
    const warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    mockChatroomFactRepository.findAllForChatroom.mockResolvedValue([]);
    mockStructuredOutputPort.extract.mockResolvedValue(null);

    await service.extractFromTurn({
      chatroomId: 5,
      userMessage: 'u',
      aiMessage: 'a',
      sourceMessageId: 6n,
    });

    expect(mockChatroomFactRepository.applyOps).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'Structured extractor returned null for chatroom=5',
    );
    warnSpy.mockRestore();
  });
});
