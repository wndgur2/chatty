import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { NotificationsService } from '../services/notifications.service';
import { RegisterDeviceDto } from '../dto/register-device.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../../auth/types/auth-principal.type';
import { isUserPrincipal } from '../../auth/types/auth-principal.type';
import { UserOnlyGuard } from '../../auth/guards/user-only.guard';
import { TestNotificationDto } from '../dto/test-notification.dto';

@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register')
  @UseGuards(UserOnlyGuard)
  async registerDevice(
    @CurrentUser() user: AuthPrincipal,
    @Body() registerDeviceDto: RegisterDeviceDto,
  ) {
    if (!isUserPrincipal(user)) {
      throw new Error('UserOnlyGuard should prevent guest access');
    }
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
