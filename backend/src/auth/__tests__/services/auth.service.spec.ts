import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../../services/auth.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { LoginDto } from '../../dto/login.dto';

describe('AuthService', () => {
  let service: AuthService;
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const mockJwtService = {
    signAsync: jest.fn(),
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
    });
    expect(result).toEqual({
      accessToken: 'new-jwt',
      user: { id: '7', username: 'bob' },
    });
  });
});
