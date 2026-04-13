import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { OllamaModule } from '../ollama/ollama.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessageHistoryService } from './message-history.service';
import { MessageSendService } from './message-send.service';
import { MessageStreamService } from './message-stream.service';
import { AiResponseService } from './ai-response.service';
import { MessagesRepository } from './messages.repository';
import { ChatroomStateRepository } from './chatroom-state.repository';

@Module({
  imports: [PrismaModule, OllamaModule, NotificationsModule],
  providers: [
    MessagesService,
    MessagesGateway,
    MessageHistoryService,
    MessageSendService,
    MessageStreamService,
    AiResponseService,
    MessagesRepository,
    ChatroomStateRepository,
  ],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
