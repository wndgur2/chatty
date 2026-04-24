import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomsRepository } from './chatrooms.repository';
import { PrismaService } from '../prisma/prisma.service';

describe('ChatroomsRepository', () => {
  let repository: ChatroomsRepository;
  const mockPrisma = {
    chatroom: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatroomsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ChatroomsRepository>(ChatroomsRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('findManyByUser queries by userId', async () => {
    mockPrisma.chatroom.findMany.mockResolvedValue([]);
    await repository.findManyByUser(3n);
    expect(mockPrisma.chatroom.findMany).toHaveBeenCalledWith({
      where: { userId: 3n },
    });
  });

  it('findByIdAndUser queries id and userId', async () => {
    await repository.findByIdAndUser(1n, 2n);
    expect(mockPrisma.chatroom.findFirst).toHaveBeenCalledWith({
      where: { id: 1n, userId: 2n },
    });
  });

  it('create forwards data to prisma', async () => {
    const data = { name: 'Room', user: { connect: { id: 1n } } };
    await repository.create(data as never);
    expect(mockPrisma.chatroom.create).toHaveBeenCalledWith({ data });
  });

  it('update forwards id and data', async () => {
    await repository.update(5n, { name: 'X' });
    expect(mockPrisma.chatroom.update).toHaveBeenCalledWith({
      where: { id: 5n },
      data: { name: 'X' },
    });
  });

  it('delete forwards id', async () => {
    await repository.delete(9n);
    expect(mockPrisma.chatroom.delete).toHaveBeenCalledWith({
      where: { id: 9n },
    });
  });

  it('transaction forwards callback to $transaction', async () => {
    const fn = (): Promise<string> => Promise.resolve('ok');
    mockPrisma.$transaction.mockImplementation(
      (cb: (tx: unknown) => Promise<string>) => cb({} as never),
    );
    const result = await repository.transaction(fn);
    expect(mockPrisma.$transaction).toHaveBeenCalledWith(fn);
    expect(result).toBe('ok');
  });
});
