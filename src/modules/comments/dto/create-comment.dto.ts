import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'I reviewed this and left one suggestion.' })
  @IsString()
  @Length(1, 5000)
  content!: string;
}
