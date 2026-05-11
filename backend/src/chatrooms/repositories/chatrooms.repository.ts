import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import type { OwnerScope } from '../../auth/utils/owner-scope.util';

@Injectable()
export class ChatroomsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private ownerWhere(scope: OwnerScope): Prisma.ChatroomWhereInput {
    if (scope.kind === 'user') {
      return { userId: scope.userId };
    }
    return { guestSessionId: scope.guestSessionId };
  }

  findManyByOwner(scope: OwnerScope) {
    return this.prisma.chatroom.findMany({ where: this.ownerWhere(scope) });
  }

  findByIdAndOwner(id: bigint, scope: OwnerScope) {
    return this.prisma.chatroom.findFirst({
      where: { id, ...this.ownerWhere(scope) },
    });
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
