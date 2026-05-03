import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomsService } from '../../services/chatrooms.service';
import { ChatroomsRepository } from '../../repositories/chatrooms.repository';
import { StorageService } from '../../../infrastructure/storage/storage.service';

const mockChatroomsRepository = {
  findManyByUser: jest.fn(),
  findByIdAndUser: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  transaction: jest.fn(),
};

const mockStorageService = {
  saveProfileImage: jest.fn(),
};

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
    const mockResult = [{ id: 1n, userId: 1n, name: 'Chat' }];
    mockChatroomsRepository.findManyByUser.mockResolvedValue(mockResult);

    const result = await service.findAll('1');
    expect(result).toEqual([{ id: '1', userId: '1', name: 'Chat' }]);
    expect(mockChatroomsRepository.findManyByUser).toHaveBeenCalledWith(1n);
  });
});
