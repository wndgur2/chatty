import { Injectable } from '@nestjs/common';
import { MessagesRepository } from './messages.repository';
import { serializeMessage } from '../common/serializers/message.serializer';

@Injectable()
export class MessageHistoryService {
  constructor(private readonly messagesRepository: MessagesRepository) {}

  async findHistory(chatroomId: number, limit = 50, offset = 0) {
    const history = await this.messagesRepository.findHistory(
      BigInt(chatroomId),
      limit,
      offset,
    );
    return history.reverse().map(serializeMessage);
  }
}
