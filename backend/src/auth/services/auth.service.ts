import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from '../dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

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
    });

    return {
      accessToken,
      user: {
        id: user.id.toString(),
        username: user.username,
      },
    };
  }
}
