import { Module } from '@nestjs/common';
import { TasksService } from './services/tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MessagesModule } from '../messages/messages.module';
import { InferenceModule } from '../inference/inference.module';

@Module({
  imports: [PrismaModule, InferenceModule, MessagesModule],
  providers: [TasksService],
})
export class TasksModule {}
