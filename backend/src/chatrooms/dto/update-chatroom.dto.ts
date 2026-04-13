import { IsString, IsOptional } from 'class-validator';

export class UpdateChatroomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  basePrompt?: string;
}
