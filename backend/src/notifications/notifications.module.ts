import { Module } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { NotificationsController } from './controllers/notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsRepository } from './repositories/notifications.repository';
import { FcmPushService } from './services/fcm-push.service';

@Module({
  imports: [PrismaModule],
  providers: [NotificationsService, NotificationsRepository, FcmPushService],
  controllers: [NotificationsController],
  exports: [FcmPushService],
})
export class NotificationsModule {}
