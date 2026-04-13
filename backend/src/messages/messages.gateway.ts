import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MessagesGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { chatroomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `chatroom_${data.chatroomId}`;
    await client.join(roomName);
    this.logger.debug(`Client ${client.id} joined room ${roomName}`);
    return { event: 'joined', data: { room: data.chatroomId } };
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: { chatroomId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const roomName = `chatroom_${data.chatroomId}`;
    await client.leave(roomName);
    this.logger.debug(`Client ${client.id} left room ${roomName}`);
    return { event: 'left', data: { room: data.chatroomId } };
  }

  streamChunkToRoom(chatroomId: number, chunk: string) {
    this.server.to(`chatroom_${chatroomId}`).emit('ai_message_chunk', {
      chatroomId,
      chunk,
    });
  }

  streamEndToRoom(chatroomId: number, content: string, messageId: number) {
    this.server.to(`chatroom_${chatroomId}`).emit('ai_message_complete', {
      chatroomId,
      content,
      messageId,
    });
  }

  emitTypingState(chatroomId: number, isTyping: boolean) {
    this.server.to(`chatroom_${chatroomId}`).emit('ai_typing_state', {
      chatroomId,
      isTyping,
    });
  }
}
