import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { AuthPrincipal } from '../types/auth-principal.type';
import { isUserPrincipal } from '../types/auth-principal.type';

@Injectable()
export class UserOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthPrincipal }>();
    const principal = request.user;
    if (!principal || !isUserPrincipal(principal)) {
      throw new ForbiddenException('Member account required.');
    }
    return true;
  }
}
