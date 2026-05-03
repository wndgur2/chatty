import { Module } from '@nestjs/common';
import { ChatroomsService } from './services/chatrooms.service';
import { ChatroomsController } from './controllers/chatrooms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsRepository } from './repositories/chatrooms.repository';
import { StorageModule } from '../infrastructure/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [ChatroomsService, ChatroomsRepository],
  controllers: [ChatroomsController],
})
export class ChatroomsModule {}
