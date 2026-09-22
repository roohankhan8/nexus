import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import * as argon2 from 'argon2';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestMetadata } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto, metadata: RequestMetadata) {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('An account with this email already exists');

    const user = await this.prisma.user.create({
      data: {
        email,
        name: dto.name?.trim() || undefined,
        passwordHash: await argon2.hash(dto.password),
      },
    });

    return this.issueTokens(user.id, user.email, metadata);
  }

  async login(dto: LoginDto, metadata: RequestMetadata) {
    const user = await this.prisma.user.findUnique({ where: { email: this.normalizeEmail(dto.email) } });
    const valid = user?.passwordHash ? await argon2.verify(user.passwordHash, dto.password) : false;
    if (!user || !valid) throw new UnauthorizedException('Invalid email or password');

    return this.issueTokens(user.id, user.email, metadata);
  }

  async refresh(refreshToken: string, metadata: RequestMetadata) {
    const [sessionId] = refreshToken.split('.', 1);
    if (!sessionId) throw new UnauthorizedException('Invalid refresh token');

    const session = await this.prisma.refreshSession.findUnique({
      where: { id: sessionId },
      include: { user: true },
    });
    if (!session) throw new UnauthorizedException('Invalid refresh token');

    if (session.revokedAt) {
      await this.prisma.refreshSession.updateMany({
        where: { familyId: session.familyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Refresh token reuse detected');
    }

    const valid = this.hashToken(refreshToken) === session.tokenHash;
    if (!valid || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const rotated = await this.prisma.refreshSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (rotated.count !== 1) throw new UnauthorizedException('Refresh token reuse detected');
    return this.issueTokens(session.user.id, session.user.email, metadata, session.familyId);
  }

  async logout(refreshToken: string) {
    const [sessionId] = refreshToken.split('.', 1);
    if (sessionId) {
      await this.prisma.refreshSession.updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async getProfile(userId: string) {
    return this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  private async issueTokens(userId: string, email: string, metadata: RequestMetadata, familyId: string = randomUUID()) {
    const accessToken = await this.jwt.signAsync({ sub: userId, email });
    const sessionId = randomUUID();
    const refreshToken = `${sessionId}.${randomBytes(32).toString('hex')}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.config.getOrThrow<number>('AUTH_REFRESH_TOKEN_DAYS'));

    await this.prisma.refreshSession.create({
      data: {
        id: sessionId,
        userId,
        familyId,
        tokenHash: this.hashToken(refreshToken),
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
