import { Module } from '@nestjs/common';
import { ChatroomsService } from './chatrooms.service';
import { ChatroomsController } from './chatrooms.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatroomsRepository } from './chatrooms.repository';
import { StorageModule } from '../infrastructure/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  providers: [ChatroomsService, ChatroomsRepository],
  controllers: [ChatroomsController],
})
export class ChatroomsModule {}
