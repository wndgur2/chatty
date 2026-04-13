import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

const mockNotificationsService = {
  registerDevice: jest.fn(),
};

describe('NotificationsController', () => {
  let controller: NotificationsController;
  const authUser = { userId: '1' };

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

  it('should register an FCM device token', async () => {
    const dto = { deviceToken: 'dummy-token' };
    const result = {
      status: 'success',
      message: 'FCM token registered successfully.',
    };
    mockNotificationsService.registerDevice.mockResolvedValue(result);

    expect(await controller.registerDevice(authUser, dto)).toBe(result);
    expect(mockNotificationsService.registerDevice).toHaveBeenCalledWith(
      authUser.userId,
      dto,
    );
  });
});
