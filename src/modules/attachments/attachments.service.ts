import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthUser } from '../auth/auth.types';

export const ATTACHMENTS_DIRECTORY = join(
  process.cwd(),
  'storage',
  'attachments',
);

@Injectable()
export class AttachmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, taskId: string, file: Express.Multer.File) {
    const task = await this.findTask(taskId);
    await this.requireMembership(user.userId, task.project.organizationId);
    return this.prisma.attachment.create({
      data: {
        taskId,
        uploadedById: user.userId,
        fileName: file.originalname,
        storageKey: file.filename,
        contentType: file.mimetype,
        sizeBytes: file.size,
      },
      include: {
        uploadedBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async list(user: AuthUser, taskId: string) {
    const task = await this.findTask(taskId);
    await this.requireMembership(user.userId, task.project.organizationId);
    return this.prisma.attachment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: {
        uploadedBy: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async getDownload(user: AuthUser, attachmentId: string) {
    const attachment = await this.findAttachment(attachmentId);
    await this.requireMembership(
      user.userId,
      attachment.task!.project.organizationId,
    );
    return attachment;
  }

  async remove(user: AuthUser, attachmentId: string) {
    const attachment = await this.findAttachment(attachmentId);
    const membership = await this.requireMembership(
      user.userId,
      attachment.task!.project.organizationId,
    );
    const isAdmin =
      membership.role === MembershipRole.OWNER ||
      membership.role === MembershipRole.ADMIN;
    if (!isAdmin && attachment.uploadedById !== user.userId)
      throw new ForbiddenException('You cannot delete this attachment');

    await this.prisma.attachment.delete({ where: { id: attachmentId } });
    await unlink(join(ATTACHMENTS_DIRECTORY, attachment.storageKey)).catch(
      () => undefined,
    );
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

  private async findAttachment(attachmentId: string) {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: { include: { project: { select: { organizationId: true } } } },
        uploadedBy: true,
      },
    });
    if (!attachment?.task) throw new NotFoundException('Attachment not found');
    return attachment;
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
