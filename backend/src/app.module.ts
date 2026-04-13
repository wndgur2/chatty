import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatroomsModule } from './chatrooms/chatrooms.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { OllamaModule } from './ollama/ollama.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { resolveAssetsDir } from './common/utils/assets-path.util';

const assetsRootPath = resolveAssetsDir(process.env.ASSETS_DIR);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: assetsRootPath,
      serveRoot: '/assets',
    }),
    ScheduleModule.forRoot(),
    ChatroomsModule,
    MessagesModule,
    NotificationsModule,
    PrismaModule,
    OllamaModule,
    TasksModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
