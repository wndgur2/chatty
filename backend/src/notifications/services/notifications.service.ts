import { Injectable, NotFoundException } from '@nestjs/common';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { FcmPushService } from './fcm-push.service';
import type { AuthPrincipal } from '../../auth/types/auth-principal.type';
import {
  isGuestPrincipal,
  isUserPrincipal,
} from '../../auth/types/auth-principal.type';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly fcmPushService: FcmPushService,
  ) {}

  async registerDevice(principal: AuthPrincipal, dto: RegisterDeviceDto) {
    const existing = await this.notificationsRepository.findDeviceByToken(
      dto.deviceToken,
    );

    if (isUserPrincipal(principal)) {
      const currentUserId = BigInt(principal.userId);
      if (!existing) {
        await this.notificationsRepository.createMemberDevice(
          currentUserId,
          dto.deviceToken,
        );
      } else if (
        existing.userId !== currentUserId ||
        existing.guestSessionId !== null
      ) {
        await this.notificationsRepository.updateDeviceToMember(
          dto.deviceToken,
          currentUserId,
        );
      }
    } else if (isGuestPrincipal(principal)) {
      const guestSessionId = principal.guestSessionId;
      if (!existing) {
        await this.notificationsRepository.createGuestDevice(
          guestSessionId,
          dto.deviceToken,
        );
      } else if (
        existing.guestSessionId !== guestSessionId ||
        existing.userId !== null
      ) {
        await this.notificationsRepository.updateDeviceToGuest(
          dto.deviceToken,
          guestSessionId,
        );
      }
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
    if (!info.user && !info.guestSessionId) {
      throw new NotFoundException(
        'Chatroom has no owner; test notifications require an owner.',
      );
    }

    return info;
  }

  async sendTestNotificationByChatroomId(chatroomId: string) {
    const info = await this.getChatroomOwnerInfo(chatroomId);
    if (info.user) {
      await this.fcmPushService.sendTestNotificationToUser({
        userId: info.user.id,
        chatroomId: info.id.toString(),
        chatroomName: info.name,
        username: info.user.username,
      });
    } else if (info.guestSessionId) {
      await this.fcmPushService.sendTestNotificationToGuestSession({
        guestSessionId: info.guestSessionId,
        chatroomId: info.id.toString(),
        chatroomName: info.name,
      });
    }

    return {
      status: 'success',
      message: 'Test notification sent.',
    };
  }
}
