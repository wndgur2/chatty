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
import { CreateChatroomDto } from './dto/create-chatroom.dto';
import { UpdateChatroomDto } from './dto/update-chatroom.dto';
import { ChatroomsService } from './chatrooms.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('api/chatrooms')
export class ChatroomsController {
  constructor(
    private readonly chatroomsService: ChatroomsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async findAll(@CurrentUser() user: AuthUser) {
    return this.chatroomsService.findAll(user.userId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('profileImage'))
  async create(
    @CurrentUser() user: AuthUser,
    @Body() createChatroomDto: CreateChatroomDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.resolveBaseUrl(req);
    return this.chatroomsService.create(
      user.userId,
      createChatroomDto,
      baseUrl,
      file,
    );
  }

  @Get(':chatroomId')
  async findOne(
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.findOne(user.userId, chatroomId);
  }

  @Patch(':chatroomId')
  @UseInterceptors(FileInterceptor('profileImage'))
  async update(
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Body() updateChatroomDto: UpdateChatroomDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const baseUrl = this.resolveBaseUrl(req);
    return this.chatroomsService.update(
      user.userId,
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
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.remove(user.userId, chatroomId);
  }

  @Post(':chatroomId/clone')
  async clone(
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.clone(user.userId, chatroomId);
  }

  @Post(':chatroomId/branch')
  async branch(
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
  ) {
    return this.chatroomsService.branch(user.userId, chatroomId);
  }
}
