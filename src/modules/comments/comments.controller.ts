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
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentsService } from './comments.service';

@ApiTags('comments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Post('tasks/:taskId/comments')
  @Version('1')
  create(
    @CurrentUser() user: AuthUser,
    @Param('taskId') taskId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(user, taskId, dto);
  }

  @Get('tasks/:taskId/comments')
  @Version('1')
  list(@CurrentUser() user: AuthUser, @Param('taskId') taskId: string) {
    return this.comments.list(user, taskId);
  }

  @Patch('comments/:commentId')
  @Version('1')
  update(
    @CurrentUser() user: AuthUser,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.comments.update(user, commentId, dto);
  }

  @Delete('comments/:commentId')
  @Version('1')
  remove(@CurrentUser() user: AuthUser, @Param('commentId') commentId: string) {
    return this.comments.remove(user, commentId);
  }
}
