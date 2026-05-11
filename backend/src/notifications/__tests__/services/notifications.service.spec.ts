import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../../services/notifications.service';
import { NotificationsRepository } from '../../repositories/notifications.repository';
import { FcmPushService } from '../../services/fcm-push.service';

const mockNotificationsRepository = {
  findDeviceByToken: jest.fn(),
  createMemberDevice: jest.fn(),
  createGuestDevice: jest.fn(),
  updateDeviceToMember: jest.fn(),
  updateDeviceToGuest: jest.fn(),
  findChatroomOwnerInfoById: jest.fn(),
};
const mockFcmPushService = {
  sendTestNotificationToUser: jest.fn(),
  sendTestNotificationToGuestSession: jest.fn(),
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

  it('should register a new member device token', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue(null);
    mockNotificationsRepository.createMemberDevice.mockResolvedValue({
      id: 1n,
    });

    const result = await service.registerDevice(
      { mode: 'user', userId: '1' },
      { deviceToken: 'dummy' },
    );
    expect(result).toEqual({
      status: 'success',
      message: 'FCM token registered successfully.',
    });
    expect(mockNotificationsRepository.createMemberDevice).toHaveBeenCalledWith(
      1n,
      'dummy',
    );
  });

  it('should update member device when token owned by another user or guest', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue({
      id: 1n,
      userId: 99n,
      guestSessionId: null,
    });
    mockNotificationsRepository.updateDeviceToMember.mockResolvedValue({
      id: 1n,
      userId: 1n,
    });

    const result = await service.registerDevice(
      { mode: 'user', userId: '1' },
      { deviceToken: 'dummy' },
    );
    expect(result.status).toBe('success');
    expect(
      mockNotificationsRepository.updateDeviceToMember,
    ).toHaveBeenCalledWith('dummy', 1n);
  });

  it('should update member device when same userId but row still guest-bound', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue({
      id: 1n,
      userId: 1n,
      guestSessionId: 'should-not-happen',
    });

    await service.registerDevice(
      { mode: 'user', userId: '1' },
      { deviceToken: 'dummy' },
    );
    expect(
      mockNotificationsRepository.updateDeviceToMember,
    ).toHaveBeenCalledWith('dummy', 1n);
  });

  it('should no-op when member re-registers same token', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue({
      id: 1n,
      userId: 1n,
      guestSessionId: null,
    });

    await service.registerDevice(
      { mode: 'user', userId: '1' },
      { deviceToken: 'dummy' },
    );
    expect(
      mockNotificationsRepository.createMemberDevice,
    ).not.toHaveBeenCalled();
    expect(
      mockNotificationsRepository.updateDeviceToMember,
    ).not.toHaveBeenCalled();
  });

  it('should register a new guest device token', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue(null);
    mockNotificationsRepository.createGuestDevice.mockResolvedValue({ id: 1n });

    const result = await service.registerDevice(
      { mode: 'guest', guestSessionId: 'gs-1' },
      { deviceToken: 'g-token' },
    );
    expect(result.status).toBe('success');
    expect(mockNotificationsRepository.createGuestDevice).toHaveBeenCalledWith(
      'gs-1',
      'g-token',
    );
  });

  it('should no-op when guest re-registers same token for same session', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue({
      id: 1n,
      userId: null,
      guestSessionId: 'gs-1',
    });

    await service.registerDevice(
      { mode: 'guest', guestSessionId: 'gs-1' },
      { deviceToken: 'g-token' },
    );
    expect(
      mockNotificationsRepository.createGuestDevice,
    ).not.toHaveBeenCalled();
    expect(
      mockNotificationsRepository.updateDeviceToGuest,
    ).not.toHaveBeenCalled();
  });

  it('should update guest device when token bound to another session or member', async () => {
    mockNotificationsRepository.findDeviceByToken.mockResolvedValue({
      id: 1n,
      userId: 5n,
      guestSessionId: null,
    });

    await service.registerDevice(
      { mode: 'guest', guestSessionId: 'gs-1' },
      { deviceToken: 'shared' },
    );
    expect(
      mockNotificationsRepository.updateDeviceToGuest,
    ).toHaveBeenCalledWith('shared', 'gs-1');
  });

  it('should send test notification by chatroom member owner', async () => {
    mockNotificationsRepository.findChatroomOwnerInfoById.mockResolvedValue({
      id: 7n,
      name: 'My Chatroom',
      guestSessionId: null,
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
    expect(
      mockFcmPushService.sendTestNotificationToGuestSession,
    ).not.toHaveBeenCalled();
    expect(result).toEqual({
      status: 'success',
      message: 'Test notification sent.',
    });
  });

  it('should send test notification for guest-owned chatroom', async () => {
    mockNotificationsRepository.findChatroomOwnerInfoById.mockResolvedValue({
      id: 7n,
      name: 'Guest room',
      guestSessionId: 'gs-99',
      user: null,
    });
    mockFcmPushService.sendTestNotificationToGuestSession.mockResolvedValue(
      undefined,
    );

    const result = await service.sendTestNotificationByChatroomId('7');

    expect(
      mockFcmPushService.sendTestNotificationToGuestSession,
    ).toHaveBeenCalledWith({
      guestSessionId: 'gs-99',
      chatroomId: '7',
      chatroomName: 'Guest room',
    });
    expect(
      mockFcmPushService.sendTestNotificationToUser,
    ).not.toHaveBeenCalled();
    expect(result.message).toBe('Test notification sent.');
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

  it('should throw NotFoundException when chatroom has no owner', async () => {
    mockNotificationsRepository.findChatroomOwnerInfoById.mockResolvedValue({
      id: 7n,
      name: 'Orphan',
      guestSessionId: null,
      user: null,
    });

    await expect(
      service.sendTestNotificationByChatroomId('7'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(
      mockFcmPushService.sendTestNotificationToUser,
    ).not.toHaveBeenCalled();
  });
});
