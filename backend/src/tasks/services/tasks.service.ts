import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import {
  AI_BACKGROUND_EVALUATION_CRON,
  INITIAL_AI_EVALUATION_DELAY_SECONDS,
  MAX_VOLUNTARY_MESSAGES_IN_A_ROW,
} from '../constants/scheduling.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { MessagesService } from '../../messages/services/messages.service';
import {
  toChatHistory,
  proactiveAiCountInRowFromNewestFirst,
} from '../../inference/shared/chat-history.util';
import { ProactiveEvaluationContext } from '../../inference/prompts/proactive-evaluator.prompt';
import { ProactiveEvaluatorService } from '../../inference/tasks/proactive-evaluator.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  private isProcessing = false;

  constructor(
    private prisma: PrismaService,
    private proactiveEvaluator: ProactiveEvaluatorService,
    private messages: MessagesService,
  ) {}

  @Cron(AI_BACKGROUND_EVALUATION_CRON)
  async handleAIBackgroundEvaluations() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const now = new Date();

      // Find chatrooms that are eligible for evaluation
      const rooms = await this.prisma.chatroom.findMany({
        where: {
          nextEvaluationTime: {
            lte: now,
          },
        },
      });

      if (rooms.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.logger.debug(
        `Found ${rooms.length} rooms eligible for AI evaluation.`,
      );

      for (const room of rooms) {
        // Lock room so it's not picked up by next cron tick
        await this.prisma.chatroom.update({
          where: { id: room.id },
          data: { nextEvaluationTime: null },
        });

        const historyRaw = await this.prisma.message.findMany({
          where: { chatroomId: room.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        });

        // Ensure there is at least one user message in the room
        if (historyRaw.length === 0) {
          continue;
        }

        const proactiveInRow = proactiveAiCountInRowFromNewestFirst(historyRaw);
        if (proactiveInRow >= MAX_VOLUNTARY_MESSAGES_IN_A_ROW) {
          this.logger.log(
            `Room ${room.id} proactive streak at cap (${proactiveInRow} >= ${MAX_VOLUNTARY_MESSAGES_IN_A_ROW}). Backing off.`,
          );
          await this.applyEvaluationBackoff(room);
          continue;
        }

        const history = toChatHistory(historyRaw);

        const newest = historyRaw[0];
        const secondsSinceLastMessage = Math.max(
          0,
          (now.getTime() - newest.createdAt.getTime()) / 1000,
        );
        const evalCtx: ProactiveEvaluationContext = {
          secondsSinceLastMessage,
          lastSender: newest.sender === 'user' ? 'user' : 'ai',
        };

        const basePrompt = room.basePrompt || 'You are a helpful assistant.';

        try {
          const shouldAnswer = await this.proactiveEvaluator.shouldAnswer(
            history,
            basePrompt,
            evalCtx,
          );

          if (shouldAnswer) {
            this.logger.log(
              `Room ${room.id} evaluating to YES. Triggering AI message.`,
            );
            // Kick off standard background generator
            this.messages
              .processBackgroundMessage(Number(room.id), true)
              .catch((e) => {
                this.logger.error(
                  `Failed executing background message for room ${room.id}`,
                  e,
                );
              });
          } else {
            const nextDelay = await this.applyEvaluationBackoff(room);
            this.logger.log(
              `Room ${room.id} evaluating to NO. Backing off to ${nextDelay}s delay.`,
            );
          }
        } catch (evalErr) {
          this.logger.error(
            `Ollama evaluation failed for room ${room.id}`,
            evalErr,
          );
          // On failure, revert to same delay and schedule it retry
          const currentDelay =
            room.currentDelaySeconds || INITIAL_AI_EVALUATION_DELAY_SECONDS;
          const nextEvalTime = new Date();
          nextEvalTime.setSeconds(nextEvalTime.getSeconds() + currentDelay);

          await this.prisma.chatroom.update({
            where: { id: room.id },
            data: {
              nextEvaluationTime: nextEvalTime,
            },
          });
        }
      }
    } catch (error) {
      this.logger.error('Error ticking AI evaluation cron job', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /** Doubles delay and schedules next evaluation (same as Ollama "do not answer"). */
  private async applyEvaluationBackoff(room: {
    id: bigint;
    currentDelaySeconds: number;
  }): Promise<number> {
    const currentDelay =
      room.currentDelaySeconds || INITIAL_AI_EVALUATION_DELAY_SECONDS;
    const nextDelay = currentDelay * 2;
    const nextEvalTime = new Date();
    nextEvalTime.setSeconds(nextEvalTime.getSeconds() + nextDelay);

    await this.prisma.chatroom.update({
      where: { id: room.id },
      data: {
        currentDelaySeconds: nextDelay,
        nextEvaluationTime: nextEvalTime,
      },
    });
    return nextDelay;
  }
}
