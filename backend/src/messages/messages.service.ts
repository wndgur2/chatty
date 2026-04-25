import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { FcmPushService } from '../notifications/fcm-push.service';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageHistoryService } from './message-history.service';
import { MessageSendService } from './message-send.service';
import { MessageStreamService } from './message-stream.service';
import { MessagesRepository } from './messages.repository';
import { ChatroomStateRepository } from './chatroom-state.repository';
import {
  buildProactiveLastInstruction,
  NORMAL_CHAT_BASE_SYSTEM,
  STABLE_VOLUNTARY_ALIGNMENT,
} from '../inference/prompts/chat-system.prompt';
import { toChatHistory } from '../inference/shared/chat-history.util';
import { ChatGenerationService } from '../inference/tasks/chat-generation.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger(MessagesService.name);

  constructor(
    private readonly messageHistoryService: MessageHistoryService,
    private readonly messageSendService: MessageSendService,
    private readonly messageStreamService: MessageStreamService,
    private readonly chatGenerationService: ChatGenerationService,
    private readonly messagesRepository: MessagesRepository,
    private readonly chatroomStateRepository: ChatroomStateRepository,
    private readonly fcmPushService: FcmPushService,
  ) {}

  async findHistory(
    userId: string,
    chatroomId: number,
    limit = 50,
    offset = 0,
  ) {
    await this.ensureRoomOwnership(userId, chatroomId);
    return this.messageHistoryService.findHistory(chatroomId, limit, offset);
  }

  async sendToAI(userId: string, chatroomId: number, dto: SendMessageDto) {
    await this.ensureRoomOwnership(userId, chatroomId);
    const message = await this.messageSendService.saveUserMessage(
      chatroomId,
      dto,
    );
    await this.chatroomStateRepository.clearNextEvaluationTime(
      BigInt(chatroomId),
    );

    this.processBackgroundMessage(chatroomId).catch((err) => {
      this.logger.error('Background processing failed', err);
    });

    return {
      messageId: message.id,
      status: 'processing',
    };
  }

  public async processBackgroundMessage(chatroomId: number, proactive = false) {
    try {
      const chatRoomIdBigInt = BigInt(chatroomId);
      const room =
        await this.chatroomStateRepository.findById(chatRoomIdBigInt);

      if (!room) return;

      const basePrompt = room.basePrompt || '';
      const systemPrompt = proactive
        ? (basePrompt ? `${basePrompt}\n\n` : '') + STABLE_VOLUNTARY_ALIGNMENT
        : [NORMAL_CHAT_BASE_SYSTEM, basePrompt]
            .filter((s) => s.trim())
            .join('\n\n');

      this.logger.debug(
        `Processing background message for chatroom ${chatroomId} with base prompt: ${basePrompt}`,
      );

      const historyRaw = await this.messagesRepository.findRecent(
        chatRoomIdBigInt,
        proactive ? 5 : 8,
      );
      const history = toChatHistory(historyRaw);

      if (proactive) {
        const lastContent = history[history.length - 1]?.content ?? '';
        history.push({
          role: 'system',
          content: buildProactiveLastInstruction(lastContent),
        });
      }

      this.messageStreamService.setTyping(chatroomId, true);
      const fullContent = await this.chatGenerationService.generate(
        history,
        systemPrompt,
        (chunk) => this.messageStreamService.streamChunk(chatroomId, chunk),
        proactive ? { proactive: true } : undefined,
      );

      this.messageStreamService.setTyping(chatroomId, false);
      const aiDbMessage = await this.messagesRepository.createMessage(
        chatRoomIdBigInt,
        'ai',
        fullContent,
        {
          deliveryMode: proactive ? 'proactive' : 'reply',
          triggerReason: proactive
            ? 'scheduler_evaluation_yes'
            : 'user_request',
          triggerContext: proactive ? { source: 'scheduler' } : null,
        },
      );
      await this.chatroomStateRepository.resetDelay(chatRoomIdBigInt);
      this.messageStreamService.streamComplete(
        chatroomId,
        fullContent,
        aiDbMessage.id.toString(),
      );

      if (proactive) {
        await this.fcmPushService
          .notifyProactiveAiMessage(room.userId, {
            chatroomId: chatroomId.toString(),
            chatroomName: room.name,
            messagePreview: fullContent,
          })
          .catch((err) => {
            this.logger.warn('FCM proactive message notify failed', err);
          });
      }
    } catch (e) {
      this.logger.error(
        `Error processing AI message for room ${chatroomId}`,
        e,
      );
      this.messageStreamService.setTyping(chatroomId, false);
      await this.chatroomStateRepository.resetDelay(BigInt(chatroomId));
    }
  }

  private async ensureRoomOwnership(userId: string, chatroomId: number) {
    const room = await this.chatroomStateRepository.findByIdAndUser(
      BigInt(chatroomId),
      BigInt(userId),
    );
    if (!room) {
      throw new ForbiddenException('You do not own this chatroom.');
    }
  }
}
