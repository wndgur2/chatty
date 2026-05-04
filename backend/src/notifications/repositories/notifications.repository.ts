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
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });
  }

  createDevice(userId: bigint, deviceToken: string) {
    return this.prisma.userDevice.create({
      data: {
        userId,
        deviceToken,
      },
    });
  }

  updateDeviceOwner(deviceToken: string, userId: bigint) {
    return this.prisma.userDevice.update({
      where: { deviceToken },
      data: { userId },
    });
  }

  findDeviceTokensByUserId(userId: bigint) {
    return this.prisma.userDevice.findMany({
      where: { userId },
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
