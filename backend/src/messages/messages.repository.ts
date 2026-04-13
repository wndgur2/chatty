import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Sender } from '@prisma/client';

@Injectable()
export class MessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findHistory(chatroomId: bigint, limit: number, offset: number) {
    return this.prisma.message.findMany({
      where: { chatroomId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  findRecent(chatroomId: bigint, take: number) {
    return this.prisma.message.findMany({
      where: { chatroomId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  createMessage(chatroomId: bigint, sender: Sender, content: string) {
    return this.prisma.message.create({
      data: {
        chatroomId,
        sender,
        content,
      },
    });
  }
}
