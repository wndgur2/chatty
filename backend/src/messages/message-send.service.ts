import { Injectable, Logger } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { MessagesRepository } from './messages.repository';
import { serializeMessage } from '../common/serializers/message.serializer';

@Injectable()
export class MessageSendService {
  private readonly logger = new Logger(MessageSendService.name);

  constructor(private readonly messagesRepository: MessagesRepository) {}

  async saveUserMessage(chatroomId: number, dto: SendMessageDto) {
    const message = await this.messagesRepository.createMessage(
      BigInt(chatroomId),
      'user',
      dto.content,
    );
    this.logger.debug(`Stored user message ${message.id.toString()}`);
    return serializeMessage(message);
  }
}
