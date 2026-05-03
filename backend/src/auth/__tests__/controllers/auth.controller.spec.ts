import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../controllers/auth.controller';
import { AuthService } from '../../services/auth.service';
import { LoginDto } from '../../dto/login.dto';

describe('AuthController', () => {
  let controller: AuthController;
  const mockAuthService = {
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should delegate login to AuthService', async () => {
    const dto: LoginDto = { username: 'alice' };
    const payload = {
      accessToken: 't',
      user: { id: '1', username: 'alice' },
    };
    mockAuthService.login.mockResolvedValue(payload);

    const result = await controller.login(dto);

    expect(mockAuthService.login).toHaveBeenCalledWith(dto);
    expect(result).toEqual(payload);
  });
});
