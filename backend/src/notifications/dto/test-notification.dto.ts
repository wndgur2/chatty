import { IsNotEmpty, IsString } from 'class-validator';

export class TestNotificationDto {
  @IsString()
  @IsNotEmpty()
  chatroomId!: string;
}
