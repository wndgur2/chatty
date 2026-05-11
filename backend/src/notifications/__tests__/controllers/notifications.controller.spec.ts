import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from '../../controllers/notifications.controller';
import { NotificationsService } from '../../services/notifications.service';

const mockNotificationsService = {
  registerDevice: jest.fn(),
};

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const userPrincipal = { mode: 'user' as const, userId: '1' };
  const guestPrincipal = {
    mode: 'guest' as const,
    guestSessionId: '00000000-0000-4000-8000-000000000001',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should register an FCM device token for member', async () => {
    const dto = { deviceToken: 'dummy-token' };
    const result = {
      status: 'success',
      message: 'FCM token registered successfully.',
    };
    mockNotificationsService.registerDevice.mockResolvedValue(result);

    expect(await controller.registerDevice(userPrincipal, dto)).toBe(result);
    expect(mockNotificationsService.registerDevice).toHaveBeenCalledWith(
      userPrincipal,
      dto,
    );
  });

  it('should register an FCM device token for guest', async () => {
    const dto = { deviceToken: 'guest-fcm' };
    const result = {
      status: 'success',
      message: 'FCM token registered successfully.',
    };
    mockNotificationsService.registerDevice.mockResolvedValue(result);

    expect(await controller.registerDevice(guestPrincipal, dto)).toBe(result);
    expect(mockNotificationsService.registerDevice).toHaveBeenCalledWith(
      guestPrincipal,
      dto,
    );
  });
});
