import { Injectable } from '@nestjs/common';
import { INITIAL_AI_EVALUATION_DELAY_SECONDS } from '../../tasks/constants/scheduling.constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { OwnerScope } from '../../auth/utils/owner-scope.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class ChatroomStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(chatroomId: bigint) {
    return this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
    });
  }

  private ownerWhere(scope: OwnerScope): Prisma.ChatroomWhereInput {
    if (scope.kind === 'user') {
      return { userId: scope.userId };
    }
    return { guestSessionId: scope.guestSessionId };
  }

  findByIdAndOwner(chatroomId: bigint, scope: OwnerScope) {
    return this.prisma.chatroom.findFirst({
      where: { id: chatroomId, ...this.ownerWhere(scope) },
    });
  }

  clearNextEvaluationTime(chatroomId: bigint) {
    return this.prisma.chatroom.update({
      where: { id: chatroomId },
      data: { nextEvaluationTime: null },
    });
  }

  resetDelay(chatroomId: bigint) {
    return this.prisma.chatroom.update({
      where: { id: chatroomId },
      data: {
        currentDelaySeconds: INITIAL_AI_EVALUATION_DELAY_SECONDS,
        nextEvaluationTime: this.getNextEvaluationTime(
          INITIAL_AI_EVALUATION_DELAY_SECONDS,
        ),
      },
    });
  }

  private getNextEvaluationTime(delaySeconds: number): Date {
    const nextTime = new Date();
    nextTime.setSeconds(nextTime.getSeconds() + delaySeconds);
    return nextTime;
  }
}
