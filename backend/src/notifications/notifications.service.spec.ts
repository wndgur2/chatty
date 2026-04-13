import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { FcmPushService } from './fcm-push.service';

const mockNotificationsRepository = {
  findDeviceByToken: jest.fn(),
  createDevice: jest.fn(),
  updateDeviceOwner: jest.fn(),
  findChatroomOwnerInfoById: jest.fn(),
};
const mockFcmPushService = {
  sendTestNotificationToUser: jest.fn(),
};

describe('NotificationsService', () => {
  let service: NotificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockNotificationsRepository,
        },
        {
          provide: FcmPushService,
          useValue: mockFcmPushService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should register a new device token', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue(null);
    mockNotificationsRepository.createDevice.mockResolvedValue({ id: 1n });

    const result = await service.registerDevice('1', { deviceToken: 'dummy' });
    expect(result).toEqual({
      status: 'success',
      message: 'FCM token registered successfully.',
    });
    expect(mockNotificationsRepository.createDevice).toHaveBeenCalled();
  });

  it('should update an existing device token if userId does not match', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue({
      id: 1n,
      userId: 99n,
    });
    mockNotificationsRepository.updateDeviceOwner.mockResolvedValue({
      id: 1n,
      userId: 1n,
    });

    const result = await service.registerDevice('1', { deviceToken: 'dummy' });
    expect(result).toEqual({
      status: 'success',
      message: 'FCM token registered successfully.',
    });
    expect(mockNotificationsRepository.updateDeviceOwner).toHaveBeenCalled();
  });

  it('should send test notification by chatroom owner info', async () => {
    mockNotificationsRepository.findChatroomOwnerInfoById.mockResolvedValue({
      id: 7n,
      name: 'My Chatroom',
      user: {
        id: 11n,
        username: 'alice',
      },
    });
    mockFcmPushService.sendTestNotificationToUser.mockResolvedValue(undefined);

    const result = await service.sendTestNotificationByChatroomId('7');

    expect(
      mockNotificationsRepository.findChatroomOwnerInfoById,
    ).toHaveBeenCalledWith(7n);
    expect(mockFcmPushService.sendTestNotificationToUser).toHaveBeenCalledWith({
      userId: 11n,
      chatroomId: '7',
      chatroomName: 'My Chatroom',
      username: 'alice',
    });
    expect(result).toEqual({
      status: 'success',
      message: 'Test notification sent.',
    });
  });

  it('should throw NotFoundException when chatroom does not exist', async () => {
    mockNotificationsRepository.findChatroomOwnerInfoById.mockResolvedValue(
      null,
    );

    await expect(
      service.sendTestNotificationByChatroomId('999'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      mockFcmPushService.sendTestNotificationToUser,
    ).not.toHaveBeenCalled();
  });
});
