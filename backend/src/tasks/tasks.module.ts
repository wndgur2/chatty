import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OllamaModule } from '../ollama/ollama.module';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [PrismaModule, OllamaModule, MessagesModule],
  providers: [TasksService],
})
export class TasksModule {}
