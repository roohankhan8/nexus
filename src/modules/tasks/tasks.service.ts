import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MembershipRole,
  Prisma,
  TaskPriority,
  TaskStatus,
} from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, projectId: string, dto: CreateTaskDto) {
    const project = await this.findProject(projectId);
    await this.requireMembership(user.userId, project.organizationId);
    await this.requireAssignee(project.organizationId, dto.assigneeId);

    return this.prisma.task.create({
      data: {
        projectId,
        createdById: user.userId,
        assigneeId: dto.assigneeId,
        title: dto.title.trim(),
        description: dto.description?.trim() || undefined,
        status: dto.status ?? TaskStatus.TODO,
        priority: dto.priority ?? TaskPriority.MEDIUM,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async list(user: AuthUser, projectId: string) {
    const project = await this.findProject(projectId);
    await this.requireMembership(user.userId, project.organizationId);
    return this.prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async get(user: AuthUser, taskId: string) {
    const task = await this.findTask(taskId);
    await this.requireMembership(user.userId, task.project.organizationId);
    return task;
  }

  async update(user: AuthUser, taskId: string, dto: UpdateTaskDto) {
    const task = await this.findTask(taskId);
    const membership = await this.requireMembership(
      user.userId,
      task.project.organizationId,
    );
    const isAdmin =
      membership.role === MembershipRole.OWNER ||
      membership.role === MembershipRole.ADMIN;
    const canEdit =
      isAdmin ||
      task.createdById === user.userId ||
      task.assigneeId === user.userId;
    if (!canEdit) throw new ForbiddenException('You cannot update this task');
    if (dto.assigneeId !== undefined && !isAdmin)
      throw new ForbiddenException('Only administrators can reassign tasks');
    await this.requireAssignee(task.project.organizationId, dto.assigneeId);

    const data: Prisma.TaskUpdateInput = {
      title: dto.title?.trim(),
      description:
        dto.description === undefined ? undefined : dto.description.trim(),
      status: dto.status,
      priority: dto.priority,
      dueDate: dto.dueDate === undefined ? undefined : new Date(dto.dueDate),
    };
    if (dto.assigneeId !== undefined)
      data.assignee = dto.assigneeId
        ? { connect: { id: dto.assigneeId } }
        : { disconnect: true };

    return this.prisma.task.update({ where: { id: taskId }, data });
  }

  async remove(user: AuthUser, taskId: string) {
    const task = await this.findTask(taskId);
    const membership = await this.requireMembership(
      user.userId,
      task.project.organizationId,
    );
    if (
      membership.role !== MembershipRole.OWNER &&
      membership.role !== MembershipRole.ADMIN
    ) {
      throw new ForbiddenException('Administrator access is required');
    }
    await this.prisma.task.delete({ where: { id: taskId } });
    return { success: true };
  }

  private async findProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async findTask(taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: { select: { organizationId: true } } },
    });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  private async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership)
      throw new ForbiddenException('You are not a member of this organization');
    return membership;
  }

  private async requireAssignee(organizationId: string, assigneeId?: string) {
    if (!assigneeId) return;
    const membership = await this.prisma.membership.findFirst({
      where: { organizationId, userId: assigneeId },
    });
    if (!membership)
      throw new ForbiddenException('Assignee must belong to this organization');
  }
}
