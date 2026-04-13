import { IsString, IsNotEmpty } from 'class-validator';

export class CreateChatroomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  basePrompt!: string;
}
