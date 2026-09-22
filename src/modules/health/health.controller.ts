import { Controller, Get, ServiceUnavailableException, Version } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { REDIS } from '../../infrastructure/redis/redis.constants';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService, @Inject(REDIS) private readonly redis: Redis) {}

  @Get()
  @Version('1')
  liveness() {
    return { status: 'ok' };
  }

  @Get('ready')
  @Version('1')
  async readiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      await this.redis.ping();
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException('Service dependencies are unavailable');
    }
  }
}
