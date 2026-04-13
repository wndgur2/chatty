import { Injectable } from '@nestjs/common';
import { INITIAL_AI_EVALUATION_DELAY_SECONDS } from '../ai-evaluation.constants';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatroomStateRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(chatroomId: bigint) {
    return this.prisma.chatroom.findUnique({
      where: { id: chatroomId },
    });
  }

  findByIdAndUser(chatroomId: bigint, userId: bigint) {
    return this.prisma.chatroom.findFirst({
      where: { id: chatroomId, userId },
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
