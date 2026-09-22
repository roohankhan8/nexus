import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, taskId: string, dto: CreateCommentDto) {
    const task = await this.findTask(taskId);
    await this.requireMembership(user.userId, task.project.organizationId);
    return this.prisma.comment.create({
      data: { taskId, authorId: user.userId, content: dto.content.trim() },
      include: { author: { select: { id: true, email: true, name: true } } },
    });
  }

  async list(user: AuthUser, taskId: string) {
    const task = await this.findTask(taskId);
    await this.requireMembership(user.userId, task.project.organizationId);
    return this.prisma.comment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, email: true, name: true } } },
    });
  }

  async update(user: AuthUser, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.findComment(commentId);
    const membership = await this.requireMembership(
      user.userId,
      comment.task.project.organizationId,
    );
    const isAdmin =
      membership.role === MembershipRole.OWNER ||
      membership.role === MembershipRole.ADMIN;
    if (!isAdmin && comment.authorId !== user.userId)
      throw new ForbiddenException('You cannot update this comment');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content?.trim() },
      include: { author: { select: { id: true, email: true, name: true } } },
    });
  }

  async remove(user: AuthUser, commentId: string) {
    const comment = await this.findComment(commentId);
    const membership = await this.requireMembership(
      user.userId,
      comment.task.project.organizationId,
    );
    const isAdmin =
      membership.role === MembershipRole.OWNER ||
      membership.role === MembershipRole.ADMIN;
    if (!isAdmin && comment.authorId !== user.userId)
      throw new ForbiddenException('You cannot delete this comment');

    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  private async findTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { organizationId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private async findComment(commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        task: { include: { project: { select: { organizationId: true } } } },
      },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  private async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership)
      throw new ForbiddenException('You are not a member of this organization');
    return membership;
  }
}
