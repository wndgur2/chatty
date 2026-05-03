import { Module } from '@nestjs/common';
import { MessagesService } from './services/messages.service';
import { MessagesController } from './controllers/messages.controller';
import { MessagesGateway } from './gateways/messages.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessageHistoryService } from './services/message-history.service';
import { MessageSendService } from './services/message-send.service';
import { MessageStreamService } from './services/message-stream.service';
import { MessagesRepository } from './repositories/messages.repository';
import { ChatroomStateRepository } from './repositories/chatroom-state.repository';
import { InferenceModule } from '../inference/inference.module';
import { MemoryModule } from './memory/memory.module';

@Module({
  imports: [PrismaModule, InferenceModule, NotificationsModule, MemoryModule],
  providers: [
    MessagesService,
    MessagesGateway,
    MessageHistoryService,
    MessageSendService,
    MessageStreamService,
    MessagesRepository,
    ChatroomStateRepository,
  ],
  controllers: [MessagesController],
  exports: [MessagesService],
})
export class MessagesModule {}
