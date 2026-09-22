import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { MembershipRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthUser } from '../auth/auth.types';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateOrganizationDto) {
    const slug = this.slug(dto.slug ?? dto.name);
    const existing = await this.prisma.organization.findUnique({
      where: { slug },
    });
    if (existing)
      throw new ConflictException('Organization slug is already in use');

    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: { name: dto.name.trim(), slug },
      });
      await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.userId,
          role: MembershipRole.OWNER,
        },
      });
      return { ...organization, role: MembershipRole.OWNER };
    });
  }

  list(user: AuthUser) {
    return this.prisma.membership.findMany({
      where: { userId: user.userId },
      select: { role: true, organization: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async get(user: AuthUser, organizationId: string) {
    await this.requireMembership(user.userId, organizationId);
    return this.prisma.organization.findUniqueOrThrow({
      where: { id: organizationId },
      include: {
        memberships: {
          include: { user: { select: { id: true, email: true, name: true } } },
        },
      },
    });
  }

  async addMember(user: AuthUser, organizationId: string, dto: AddMemberDto) {
    const actor = await this.requireMembership(user.userId, organizationId);
    this.requireAdmin(actor.role);
    if (dto.role === MembershipRole.OWNER)
      throw new ForbiddenException('Owner transfer is not supported yet');

    const member = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!member) throw new NotFoundException('User not found');

    try {
      return await this.prisma.membership.create({
        data: { organizationId, userId: member.id, role: dto.role },
        select: {
          role: true,
          user: { select: { id: true, email: true, name: true } },
        },
      });
    } catch (error) {
      if (this.isUniqueError(error))
        throw new ConflictException('User is already a member');
      throw error;
    }
  }

  async updateMember(
    user: AuthUser,
    organizationId: string,
    memberId: string,
    dto: UpdateMemberDto,
  ) {
    const actor = await this.requireMembership(user.userId, organizationId);
    if (actor.role !== MembershipRole.OWNER)
      throw new ForbiddenException('Only the owner can change roles');
    if (dto.role === MembershipRole.OWNER)
      throw new ForbiddenException('Owner transfer is not supported yet');

    return this.prisma.membership.update({
      where: { organizationId_userId: { organizationId, userId: memberId } },
      data: { role: dto.role },
      select: {
        role: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async removeMember(user: AuthUser, organizationId: string, memberId: string) {
    const actor = await this.requireMembership(user.userId, organizationId);
    this.requireAdmin(actor.role);
    const member = await this.requireMembership(memberId, organizationId);
    if (member.role === MembershipRole.OWNER)
      throw new ForbiddenException('The owner cannot be removed');

    await this.prisma.membership.delete({
      where: { organizationId_userId: { organizationId, userId: memberId } },
    });
    return { success: true };
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
