import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomsService } from '../../services/chatrooms.service';
import { ChatroomsRepository } from '../../repositories/chatrooms.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';

const mockChatroomsRepository = {
  findManyByOwner: jest.fn(),
  findByIdAndOwner: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
};

const mockStorageService = {
  saveProfileImage: jest.fn(),
};

const userScope = { kind: 'user' as const, userId: 1n };

describe('ChatroomsService', () => {
  let service: ChatroomsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatroomsService,
        { provide: ChatroomsRepository, useValue: mockChatroomsRepository },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ChatroomsService>(ChatroomsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find all chatrooms', async () => {
    const mockResult = [
      {
        id: 1n,
        userId: 1n,
        guestSessionId: null,
        name: 'Chat',
        basePrompt: null,
        profileImageUrl: null,
        currentDelaySeconds: 60,
        nextEvaluationTime: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    mockChatroomsRepository.findManyByOwner.mockResolvedValue(mockResult);

    const result = await service.findAll(userScope);
    expect(result).toEqual([
      {
        ...mockResult[0],
        id: '1',
        userId: '1',
        guestSessionId: null,
      },
    ]);
    expect(mockChatroomsRepository.findManyByOwner).toHaveBeenCalledWith(
      userScope,
    );
  });
});
