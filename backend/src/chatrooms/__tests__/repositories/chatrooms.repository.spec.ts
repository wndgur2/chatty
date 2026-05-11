import { Test, TestingModule } from '@nestjs/testing';
import { ChatroomsRepository } from '../../repositories/chatrooms.repository';
import { PrismaService } from '../../../prisma/prisma.service';

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

  it('findManyByOwner queries by userId for user scope', async () => {
    mockPrisma.chatroom.findMany.mockResolvedValue([]);
    await repository.findManyByOwner({ kind: 'user', userId: 3n });
    expect(mockPrisma.chatroom.findMany).toHaveBeenCalledWith({
      where: { userId: 3n },
    });
  });

  it('findManyByOwner queries by guestSessionId for guest scope', async () => {
    mockPrisma.chatroom.findMany.mockResolvedValue([]);
    await repository.findManyByOwner({
      kind: 'guest',
      guestSessionId: 'g-1',
    });
    expect(mockPrisma.chatroom.findMany).toHaveBeenCalledWith({
      where: { guestSessionId: 'g-1' },
    });
  });

  it('findByIdAndOwner queries id and owner for user scope', async () => {
    await repository.findByIdAndOwner(1n, { kind: 'user', userId: 2n });
    expect(mockPrisma.chatroom.findFirst).toHaveBeenCalledWith({
      where: { id: 1n, userId: 2n },
    });
  });

  it('findByIdAndOwner queries id and guestSessionId for guest scope', async () => {
    await repository.findByIdAndOwner(1n, {
      kind: 'guest',
      guestSessionId: 'g-2',
    });
    expect(mockPrisma.chatroom.findFirst).toHaveBeenCalledWith({
      where: { id: 1n, guestSessionId: 'g-2' },
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
