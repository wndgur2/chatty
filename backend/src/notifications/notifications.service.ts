import { Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { NotificationsRepository } from './notifications.repository';
import { FcmPushService } from './fcm-push.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly fcmPushService: FcmPushService,
  ) {}

  async registerDevice(userId: string, dto: RegisterDeviceDto) {
    const currentUserId = BigInt(userId);
    const existing = await this.notificationsRepository.findDeviceByToken(
      dto.deviceToken,
    );

    if (!existing) {
      await this.notificationsRepository.createDevice(
        currentUserId,
        dto.deviceToken,
      );
    } else if (existing.userId !== currentUserId) {
      await this.notificationsRepository.updateDeviceOwner(
        dto.deviceToken,
        currentUserId,
      );
    }

    return {
      status: 'success',
      message: 'FCM token registered successfully.',
    };
  }

  async getChatroomOwnerInfo(chatroomId: string) {
    const info = await this.notificationsRepository.findChatroomOwnerInfoById(
      BigInt(chatroomId),
    );
    if (!info) {
      throw new NotFoundException('Chatroom not found');
    }

    return {
      chatroomId: info.id,
      chatroomName: info.name,
      userId: info.user.id,
      username: info.user.username,
    };
  }

  async sendTestNotificationByChatroomId(chatroomId: string) {
    const info = await this.getChatroomOwnerInfo(chatroomId);
    await this.fcmPushService.sendTestNotificationToUser({
      userId: info.userId,
      chatroomId: info.chatroomId.toString(),
      chatroomName: info.chatroomName,
      username: info.username,
    });

    return {
      status: 'success',
      message: 'Test notification sent.',
    };
  }
}
