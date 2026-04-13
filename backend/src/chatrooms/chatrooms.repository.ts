import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatroomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findManyByUser(userId: bigint) {
    return this.prisma.chatroom.findMany({ where: { userId } });
  }

  findByIdAndUser(id: bigint, userId: bigint) {
    return this.prisma.chatroom.findFirst({ where: { id, userId } });
  }

  create(data: Prisma.ChatroomCreateInput) {
    return this.prisma.chatroom.create({ data });
  }

  update(id: bigint, data: Prisma.ChatroomUpdateInput) {
    return this.prisma.chatroom.update({
      where: { id },
      data,
    });
  }

  delete(id: bigint) {
    return this.prisma.chatroom.delete({ where: { id } });
  }

  transaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(fn);
  }
}
