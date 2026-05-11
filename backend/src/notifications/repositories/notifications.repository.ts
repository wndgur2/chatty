import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findDeviceByToken(deviceToken: string) {
    return this.prisma.userDevice.findUnique({
      where: { deviceToken },
    });
  }

  findChatroomOwnerInfoById(chatroomId: bigint) {
    return this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
      select: {
        id: true,
        name: true,
        guestSessionId: true,
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  createMemberDevice(userId: bigint, deviceToken: string) {
    return this.prisma.userDevice.create({
      data: {
        userId,
        guestSessionId: null,
        deviceToken,
      },
    });
  }

  createGuestDevice(guestSessionId: string, deviceToken: string) {
    return this.prisma.userDevice.create({
      data: {
        userId: null,
        guestSessionId,
        deviceToken,
      },
    });
  }

  updateDeviceToMember(deviceToken: string, userId: bigint) {
    return this.prisma.userDevice.update({
      where: { deviceToken },
      data: {
        userId,
        guestSessionId: null,
      },
    });
  }

  updateDeviceToGuest(deviceToken: string, guestSessionId: string) {
    return this.prisma.userDevice.update({
      where: { deviceToken },
      data: {
        userId: null,
        guestSessionId,
      },
    });
  }

  findDeviceTokensByUserId(userId: bigint) {
    return this.prisma.userDevice.findMany({
      where: { userId },
      select: { deviceToken: true },
    });
  }

  findDeviceTokensByGuestSessionId(guestSessionId: string) {
    return this.prisma.userDevice.findMany({
      where: { guestSessionId },
      select: { deviceToken: true },
    });
  }

  deleteByDeviceTokens(deviceTokens: string[]) {
    if (deviceTokens.length === 0) {
      return Promise.resolve({ count: 0 });
    }
    return this.prisma.userDevice.deleteMany({
      where: { deviceToken: { in: deviceTokens } },
    });
  }
}
