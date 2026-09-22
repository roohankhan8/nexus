import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Post('projects/:projectId/tasks')
  @Version('1')
  create(
    @CurrentUser() user: AuthUser,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasks.create(user, projectId, dto);
  }

  @Get('projects/:projectId/tasks')
  @Version('1')
  list(@CurrentUser() user: AuthUser, @Param('projectId') projectId: string) {
    return this.tasks.list(user, projectId);
  }

  @Get('tasks/:taskId')
  @Version('1')
  get(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    return this.tasks.get(user, taskId);
  }

  @Patch('tasks/:taskId')
  @Version('1')
  update(
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasks.update(user, taskId, dto);
  }

  @Delete('tasks/:taskId')
  @Version('1')
  remove(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    return this.tasks.remove(user, taskId);
  }
}
