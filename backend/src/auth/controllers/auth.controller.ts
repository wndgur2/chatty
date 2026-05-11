import {
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserOnlyGuard } from '../guards/user-only.guard';
import { LoginDto } from '../dto/login.dto';
import { AuthService } from '../services/auth.service';
import type { AuthPrincipal } from '../types/auth-principal.type';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('guest-session')
  async createGuestSession() {
    return this.authService.createGuestSession();
  }

  @Post('merge-guest')
  @UseGuards(UserOnlyGuard)
  async mergeGuest(
    @CurrentUser() user: AuthPrincipal,
    @Headers('x-guest-token') guestToken: string | undefined,
  ) {
    const trimmed = guestToken?.trim();
    if (!trimmed) {
      throw new BadRequestException('X-Guest-Token header is required.');
    }
    return this.authService.mergeGuestIntoUser(user, trimmed);
  }
}
