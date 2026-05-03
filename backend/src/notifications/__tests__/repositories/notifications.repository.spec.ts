import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from '../../repositories/notifications.repository';
import { PrismaService } from '../../../prisma/prisma.service';

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  const mockPrisma = {
    userDevice: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    chatroom: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('findDeviceByToken queries userDevice', async () => {
    await repository.findDeviceByToken('tok');
    expect(mockPrisma.userDevice.findUnique).toHaveBeenCalledWith({
      where: { deviceToken: 'tok' },
    });
  });

  it('findChatroomOwnerInfoById selects owner fields', async () => {
    await repository.findChatroomOwnerInfoById(5n);
    expect(mockPrisma.chatroom.findUnique).toHaveBeenCalledWith({
      where: { id: 5n },
      select: {
        id: true,
        name: true,
        user: { select: { id: true, username: true } },
      },
    });
  });

  it('createDevice creates row', async () => {
    await repository.createDevice(1n, 'd1');
    expect(mockPrisma.userDevice.create).toHaveBeenCalledWith({
      data: { userId: 1n, deviceToken: 'd1' },
    });
  });

  it('updateDeviceOwner updates by token', async () => {
    await repository.updateDeviceOwner('t', 9n);
    expect(mockPrisma.userDevice.update).toHaveBeenCalledWith({
      where: { deviceToken: 't' },
      data: { userId: 9n },
    });
  });

  it('findDeviceTokensByUserId returns tokens', async () => {
    await repository.findDeviceTokensByUserId(3n);
    expect(mockPrisma.userDevice.findMany).toHaveBeenCalledWith({
      where: { userId: 3n },
      select: { deviceToken: true },
    });
  });

  it('deleteByDeviceTokens resolves count zero when empty', async () => {
    const result = await repository.deleteByDeviceTokens([]);
    expect(result).toEqual({ count: 0 });
    expect(mockPrisma.userDevice.deleteMany).not.toHaveBeenCalled();
  });

  it('deleteByDeviceTokens calls deleteMany when non-empty', async () => {
    mockPrisma.userDevice.deleteMany.mockResolvedValue({ count: 2 });
    const result = await repository.deleteByDeviceTokens(['a', 'b']);
    expect(mockPrisma.userDevice.deleteMany).toHaveBeenCalledWith({
      where: { deviceToken: { in: ['a', 'b'] } },
    });
    expect(result).toEqual({ count: 2 });
  });
});
