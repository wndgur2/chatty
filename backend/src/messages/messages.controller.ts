import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { FindHistoryQueryDto } from './dto/find-history-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('api/chatrooms/:chatroomId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async findHistory(
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Query() query: FindHistoryQueryDto,
  ) {
    return this.messagesService.findHistory(
      user.userId,
      chatroomId,
      query.limit,
      query.offset,
    );
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async sendToAI(
    @CurrentUser() user: AuthUser,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.messagesService.sendToAI(
      user.userId,
      chatroomId,
      sendMessageDto,
    );
  }
}
