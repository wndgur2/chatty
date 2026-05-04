import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from '../controllers/notifications.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsRepository } from '../repositories/notifications.repository';
import { FcmPushService } from './fcm-push.service';
import { AuthModule } from '../../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [NotificationsService, NotificationsRepository, FcmPushService],
  controllers: [NotificationsController],
  exports: [FcmPushService],
})
export class NotificationsModule {}
