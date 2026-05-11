import { Controller, Post, Body } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../../auth/types/auth-principal.type';
import { TestNotificationDto } from '../dto/test-notification.dto';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  async registerDevice(
    @CurrentUser() principal: AuthPrincipal,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    return this.notificationsService.registerDevice(
      principal,
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
