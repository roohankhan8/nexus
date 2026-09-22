import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Website redesign' })
  @IsString()
  @Length(2, 120)
  name!: string;

  @ApiProperty({ example: 'website-redesign', required: false })
  @IsOptional()
  @IsString()
  @Length(2, 80)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiProperty({ example: 'Refresh the public website.', required: false })
  @IsOptional()
  @IsString()
  @Length(0, 2000)
  description?: string;
}
