import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../services/auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../../dto/login.dto';
import {
  JWT_CLAIM_TYP_GUEST,
  JWT_CLAIM_TYP_USER,
} from '../../constants/jwt-claims.constants';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    guestSession: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const mockJwtService = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login existing user and return token and user', async () => {
    const dto: LoginDto = { username: 'alice' };
    const user = { id: 42n, username: 'alice' };
    mockPrisma.user.findUnique.mockResolvedValue(user);
    mockJwtService.signAsync.mockResolvedValue('jwt-token');

    const result = await service.login(dto);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { username: 'alice' },
    });
    expect(mockPrisma.user.create).not.toHaveBeenCalled();
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: '42',
      username: 'alice',
      typ: JWT_CLAIM_TYP_USER,
    });
    expect(result).toEqual({
      accessToken: 'jwt-token',
      user: { id: '42', username: 'alice' },
    });
  });

  it('should create user when missing then return token and user', async () => {
    const dto: LoginDto = { username: 'bob' };
    const created = { id: 7n, username: 'bob' };
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.user.create.mockResolvedValue(created);
    mockJwtService.signAsync.mockResolvedValue('new-jwt');

    const result = await service.login(dto);

    expect(mockPrisma.user.create).toHaveBeenCalledWith({
      data: { username: 'bob' },
    });
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: '7',
      username: 'bob',
      typ: JWT_CLAIM_TYP_USER,
    });
    expect(result).toEqual({
      accessToken: 'new-jwt',
      user: { id: '7', username: 'bob' },
    });
  });

  it('should create guest session and return guest token', async () => {
    mockPrisma.guestSession.create.mockImplementation(({ data }) =>
      Promise.resolve({ id: data.id }),
    );
    mockJwtService.signAsync.mockResolvedValue('guest-jwt');

    const result = await service.createGuestSession();

    const createdId = mockPrisma.guestSession.create.mock.calls[0][0].data
      .id as string;
    expect(createdId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.guestSessionId).toBe(createdId);
    expect(mockJwtService.signAsync).toHaveBeenCalledWith({
      sub: createdId,
      typ: JWT_CLAIM_TYP_GUEST,
    });
    expect(result.accessToken).toBe('guest-jwt');
  });

  it('should merge guest data into member user', async () => {
    const txMocks = {
      guestSession: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'g1',
          mergedAt: null,
        }),
        update: jest.fn().mockResolvedValue({}),
      },
      chatroom: {
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      memory: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof txMocks) => Promise<unknown>) => fn(txMocks),
    );
    mockJwtService.verifyAsync.mockResolvedValue({
      sub: 'g1',
      typ: JWT_CLAIM_TYP_GUEST,
    });

    const result = await service.mergeGuestIntoUser(
      { mode: 'user', userId: '99' },
      'guest-raw-token',
    );

    expect(mockJwtService.verifyAsync).toHaveBeenCalled();
    expect(txMocks.chatroom.updateMany).toHaveBeenCalledWith({
      where: { guestSessionId: 'g1' },
      data: { userId: 99n, guestSessionId: null },
    });
    expect(txMocks.memory.updateMany).toHaveBeenCalledWith({
      where: { guestSessionId: 'g1' },
      data: { userId: 99n, guestSessionId: null },
    });
    expect(result).toEqual({ success: true });
  });
});
