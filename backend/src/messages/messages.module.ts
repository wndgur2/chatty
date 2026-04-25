import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { MessageHistoryService } from './message-history.service';
import { MessageSendService } from './message-send.service';
import { MessageStreamService } from './message-stream.service';
import { MessagesRepository } from './messages.repository';
import { ChatroomStateRepository } from './chatroom-state.repository';
import { InferenceModule } from '../inference/inference.module';

@Module({
  imports: [PrismaModule, InferenceModule, NotificationsModule],
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
