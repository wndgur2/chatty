import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { TestNotificationDto } from './dto/test-notification.dto';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  async registerDevice(
    @CurrentUser() user: AuthUser,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(
      user.userId,
      registerDeviceDto,
    );
  }

  @Post('test')
  async sendTestNotification(@Body() dto: TestNotificationDto) {
    return this.notificationsService.sendTestNotificationByChatroomId(
      dto.chatroomId,
    );
  }
}
