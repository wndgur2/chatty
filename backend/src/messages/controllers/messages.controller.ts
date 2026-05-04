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
import { MessagesService } from '../services/messages.service';
import { SendMessageDto } from '../dto/send-message.dto';
import { FindHistoryQueryDto } from '../dto/find-history-query.dto';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import type { AuthPrincipal } from '../../auth/types/auth-principal.type';
import { ownerScopeFromPrincipal } from '../../auth/utils/owner-scope.util';

@Controller('api/chatrooms/:chatroomId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  async findHistory(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Query() query: FindHistoryQueryDto,
  ) {
    return this.messagesService.findHistory(
      ownerScopeFromPrincipal(user),
      chatroomId,
      query.limit,
      query.offset,
    );
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async sendToAI(
    @CurrentUser() user: AuthPrincipal,
    @Param('chatroomId', ParseIntPipe) chatroomId: number,
    @Body() sendMessageDto: SendMessageDto,
  ) {
    return this.messagesService.sendToAI(
      ownerScopeFromPrincipal(user),
      chatroomId,
      sendMessageDto,
    );
  }
}
