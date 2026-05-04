import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateChatroomDto } from '../dto/create-chatroom.dto';
import { UpdateChatroomDto } from '../dto/update-chatroom.dto';
import { ChatroomsService } from '../services/chatrooms.service';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../../auth/types/auth-principal.type';
import { ownerScopeFromPrincipal } from '../../auth/utils/owner-scope.util';

@Controller('api/chatrooms')
export class ChatroomsController {
  constructor(
    private readonly chatroomsService: ChatroomsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: AuthPrincipal) {
    return this.chatroomsService.findAll(ownerScopeFromPrincipal(user));
  }

  @Post()
  @UseInterceptors(FileInterceptor('profileImage'))
  async create(
    @CurrentUser() user: AuthPrincipal,
    @Body() createChatroomDto: CreateChatroomDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.resolveBaseUrl(req);
    return this.chatroomsService.create(
      ownerScopeFromPrincipal(user),
      createChatroomDto,
      baseUrl,
      file,
    );
  }

  @Get(':chatroomId')
  async findOne(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.findOne(
      ownerScopeFromPrincipal(user),
      chatroomId,
    );
  }

  @Patch(':chatroomId')
  @UseInterceptors(FileInterceptor('profileImage'))
  async update(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Body() updateChatroomDto: UpdateChatroomDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.resolveBaseUrl(req);
    return this.chatroomsService.update(
      ownerScopeFromPrincipal(user),
      chatroomId,
      updateChatroomDto,
      baseUrl,
      file,
    );
  }

  private resolveBaseUrl(req: Request): string {
    const publicOrigin = this.configService.get<string>('PUBLIC_ORIGIN');
    if (publicOrigin) {
      return publicOrigin.replace(/\/+$/, '');
    }
    return `${req.protocol}://${req.get('host')}`;
  }

  @Delete(':chatroomId')
  async remove(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.remove(
      ownerScopeFromPrincipal(user),
      chatroomId,
    );
  }

  @Post(':chatroomId/clone')
  async clone(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.clone(
      ownerScopeFromPrincipal(user),
      chatroomId,
    );
  }

  @Post(':chatroomId/branch')
  async branch(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.branch(
      ownerScopeFromPrincipal(user),
      chatroomId,
    );
  }
}
