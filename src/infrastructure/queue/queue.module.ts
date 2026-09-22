import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS } from '../redis/redis.constants';
import { RedisModule } from '../redis/redis.module';

export const QUEUE_CONNECTION = Symbol('QUEUE_CONNECTION');

@Module({
  imports: [RedisModule],
  providers: [
    {
      provide: QUEUE_CONNECTION,
      inject: [REDIS, ConfigService],
      useFactory: (redis: Redis, config: ConfigService) => ({
        connection: redis,
        prefix: config.get<string>('NODE_ENV', 'development'),
      }),
    },
  ],
  exports: [QUEUE_CONNECTION],
})
export class QueueModule {}
