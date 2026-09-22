import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, organizationId: string, dto: CreateProjectDto) {
    const membership = await this.requireMembership(
      user.userId,
      organizationId,
    );
    this.requireAdmin(membership.role);
    const slug = this.slug(dto.slug ?? dto.name);

    try {
      return await this.prisma.project.create({
        data: {
          organizationId,
          createdById: user.userId,
          name: dto.name.trim(),
          slug,
          description: dto.description?.trim() || undefined,
        },
      });
    } catch (error) {
      if (this.isUniqueError(error))
        throw new ConflictException(
          'Project slug is already in use in this organization',
        );
      throw error;
    }
  }

  async list(user: AuthUser, organizationId: string) {
    await this.requireMembership(user.userId, organizationId);
    return this.prisma.project.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(user: AuthUser, projectId: string) {
    const project = await this.findProject(projectId);
    await this.requireMembership(user.userId, project.organizationId);
    return project;
  }

  async update(user: AuthUser, projectId: string, dto: UpdateProjectDto) {
    const project = await this.findProject(projectId);
    const membership = await this.requireMembership(
      user.userId,
      project.organizationId,
    );
    this.requireAdmin(membership.role);

    try {
      return await this.prisma.project.update({
        where: { id: projectId },
        data: {
          name: dto.name?.trim(),
          slug: dto.slug ? this.slug(dto.slug) : undefined,
          description:
            dto.description === undefined ? undefined : dto.description.trim(),
        },
      });
    } catch (error) {
      if (this.isUniqueError(error))
        throw new ConflictException(
          'Project slug is already in use in this organization',
        );
      throw error;
    }
  }

  async remove(user: AuthUser, projectId: string) {
    const project = await this.findProject(projectId);
    const membership = await this.requireMembership(
      user.userId,
      project.organizationId,
    );
    this.requireAdmin(membership.role);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { success: true };
  }

  private async findProject(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  private async requireMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership)
      throw new ForbiddenException('You are not a member of this organization');
    return membership;
  }

  private requireAdmin(role: MembershipRole) {
    if (role !== MembershipRole.OWNER && role !== MembershipRole.ADMIN) {
      throw new ForbiddenException('Administrator access is required');
    }
  }

  private slug(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80);
  }

  private isUniqueError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
