import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DEV_JWT_SECRET_FALLBACK } from '../constants/auth.constants';
import { AuthUser } from '../types/auth-user.type';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET ?? DEV_JWT_SECRET_FALLBACK,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    return { userId: payload.sub };
  }
}
