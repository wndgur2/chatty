import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsRepository } from './notifications.repository';
import { FcmPushService } from './fcm-push.service';

@Module({
  imports: [PrismaModule],
  providers: [NotificationsService, NotificationsRepository, FcmPushService],
  controllers: [NotificationsController],
  exports: [FcmPushService],
})
export class NotificationsModule {}
