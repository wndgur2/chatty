import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';
import { ChatroomsModule } from './chatrooms/chatrooms.module';
import { MessagesModule } from './messages/messages.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { TasksModule } from './tasks/tasks.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { resolveAssetsDir } from './common/utils/assets-path.util';
import { InferenceModule } from './inference/inference.module';
import { HealthCheckModule } from './health-check/health-check.module';

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
    InferenceModule,
    TasksModule,
    AuthModule,
    HealthCheckModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
