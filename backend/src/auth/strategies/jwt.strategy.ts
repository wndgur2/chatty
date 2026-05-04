import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { DEV_JWT_SECRET_FALLBACK } from '../constants/auth.constants';
import {
  JWT_CLAIM_TYP_GUEST,
  JWT_CLAIM_TYP_USER,
} from '../constants/jwt-claims.constants';
import type { AuthPrincipal } from '../types/auth-principal.type';

interface JwtPayload {
  sub: string;
  typ?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? DEV_JWT_SECRET_FALLBACK,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthPrincipal> {
    if (payload.typ === JWT_CLAIM_TYP_GUEST) {
      const session = await this.prisma.guestSession.findUnique({
        where: { id: payload.sub },
      });
      if (!session || session.mergedAt !== null) {
        throw new UnauthorizedException('Guest session is invalid or merged.');
      }
      return { mode: 'guest', guestSessionId: payload.sub };
    }

    if (
      payload.typ === JWT_CLAIM_TYP_USER ||
      payload.typ === undefined ||
      payload.typ === ''
    ) {
      return { mode: 'user', userId: payload.sub };
    }

    throw new UnauthorizedException('Invalid token type.');
  }
}
