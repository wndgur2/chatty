import { Server, Socket } from 'socket.io';
import { MessagesGateway } from '../../gateways/messages.gateway';

describe('MessagesGateway', () => {
  let gateway: MessagesGateway;
  let emit: jest.Mock;
  let to: jest.Mock;

  beforeEach(() => {
    gateway = new MessagesGateway();
    emit = jest.fn();
    to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as unknown as Server;
  });

  it('handleJoinRoom joins socket and returns joined payload', async () => {
    const join = jest.fn().mockResolvedValue(undefined);
    const client = { id: 'c1', join } as unknown as Socket;

    const result = await gateway.handleJoinRoom({ chatroomId: 5 }, client);

    expect(join).toHaveBeenCalledWith('chatroom_5');
    expect(result).toEqual({ event: 'joined', data: { room: 5 } });
  });

  it('handleLeaveRoom leaves socket and returns left payload', async () => {
    const leave = jest.fn().mockResolvedValue(undefined);
    const client = { id: 'c2', leave } as unknown as Socket;

    const result = await gateway.handleLeaveRoom({ chatroomId: 3 }, client);

    expect(leave).toHaveBeenCalledWith('chatroom_3');
    expect(result).toEqual({ event: 'left', data: { room: 3 } });
  });

  it('streamChunkToRoom emits ai_message_chunk', () => {
    gateway.streamChunkToRoom(1, 'chunk');
    expect(to).toHaveBeenCalledWith('chatroom_1');
    expect(emit).toHaveBeenCalledWith('ai_message_chunk', {
      chatroomId: 1,
      chunk: 'chunk',
    });
  });

  it('streamEndToRoom emits ai_message_complete', () => {
    gateway.streamEndToRoom(2, 'full', 99);
    expect(to).toHaveBeenCalledWith('chatroom_2');
    expect(emit).toHaveBeenCalledWith('ai_message_complete', {
      chatroomId: 2,
      content: 'full',
      messageId: 99,
    });
  });

  it('emitTypingState emits ai_typing_state', () => {
    gateway.emitTypingState(4, true);
    expect(to).toHaveBeenCalledWith('chatroom_4');
    expect(emit).toHaveBeenCalledWith('ai_typing_state', {
      chatroomId: 4,
      isTyping: true,
    });
  });
});
