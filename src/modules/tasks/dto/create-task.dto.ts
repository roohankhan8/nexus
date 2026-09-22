import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { TaskPriority, TaskStatus } from '@prisma/client';

export class CreateTaskDto {
  @ApiProperty({ example: 'Prepare launch checklist' })
  @IsString()
  @Length(2, 200)
  title!: string;

  @ApiProperty({
    example: 'Review the final release requirements.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 5000)
  description?: string;

  @ApiProperty({ enum: TaskStatus, required: false, default: TaskStatus.TODO })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiProperty({
    enum: TaskPriority,
    required: false,
    default: TaskPriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiProperty({ example: '2026-10-01T12:00:00.000Z', required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ example: 'cmf123456789', required: false })
  @IsOptional()
  @IsString()
  @Length(1, 40)
  assigneeId?: string;
}
