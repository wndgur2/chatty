import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { DEV_JWT_SECRET_FALLBACK } from '../constants/auth.constants';
import {
  JWT_CLAIM_TYP_GUEST,
  JWT_CLAIM_TYP_USER,
} from '../constants/jwt-claims.constants';
import { LoginDto } from '../dto/login.dto';
import type { AuthPrincipal } from '../types/auth-principal.type';
import { isUserPrincipal } from '../types/auth-principal.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private jwtSecret(): string {
    return process.env.JWT_SECRET ?? DEV_JWT_SECRET_FALLBACK;
  }

  async login(dto: LoginDto) {
    const existing = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });

    const user =
      existing ??
      (await this.prisma.user.create({
        data: { username: dto.username },
      }));

    const accessToken = await this.jwtService.signAsync({
      sub: user.id.toString(),
      username: user.username,
      typ: JWT_CLAIM_TYP_USER,
    });

    return {
      accessToken,
      user: {
        id: user.id.toString(),
        username: user.username,
      },
    };
  }

  async createGuestSession() {
    const id = randomUUID();
    await this.prisma.guestSession.create({
      data: { id },
    });

    const accessToken = await this.jwtService.signAsync({
      sub: id,
      typ: JWT_CLAIM_TYP_GUEST,
    });

    return {
      accessToken,
      guestSessionId: id,
    };
  }

  async mergeGuestIntoUser(member: AuthPrincipal, guestToken: string) {
    if (!isUserPrincipal(member)) {
      throw new ForbiddenException();
    }

    let guestPayload: { sub: string; typ?: string };
    try {
      guestPayload = await this.jwtService.verifyAsync<{
        sub: string;
        typ?: string;
      }>(guestToken, { secret: this.jwtSecret() });
    } catch {
      throw new BadRequestException('Invalid guest token.');
    }

    if (guestPayload.typ !== JWT_CLAIM_TYP_GUEST) {
      throw new BadRequestException('Guest token required.');
    }

    const guestSessionId = guestPayload.sub;
    const userIdBigInt = BigInt(member.userId);

    await this.prisma.$transaction(async (tx) => {
      const guestSession = await tx.guestSession.findUnique({
        where: { id: guestSessionId },
      });
      if (!guestSession || guestSession.mergedAt !== null) {
        throw new BadRequestException(
          'Guest session not found or already merged.',
        );
      }

      await tx.chatroom.updateMany({
        where: { guestSessionId },
        data: { userId: userIdBigInt, guestSessionId: null },
      });

      await tx.memory.updateMany({
        where: { guestSessionId },
        data: { userId: userIdBigInt, guestSessionId: null },
      });

      await tx.guestSession.update({
        where: { id: guestSessionId },
        data: {
          mergedAt: new Date(),
          mergedIntoUserId: userIdBigInt,
        },
      });
    });

    return { success: true as const };
  }
}
