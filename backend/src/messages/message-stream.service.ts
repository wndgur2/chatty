import { Injectable } from '@nestjs/common';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessageStreamService {
  constructor(private readonly gateway: MessagesGateway) {}

  setTyping(chatroomId: number, isTyping: boolean) {
    this.gateway.emitTypingState(chatroomId, isTyping);
  }

  streamChunk(chatroomId: number, chunk: string) {
    this.gateway.streamChunkToRoom(chatroomId, chunk);
  }

  streamComplete(chatroomId: number, content: string, messageId: string) {
    this.gateway.streamEndToRoom(chatroomId, content, Number(messageId));
  }
}
