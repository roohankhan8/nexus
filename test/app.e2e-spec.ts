import { INestApplication, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/infrastructure/database/prisma.service';
import { REDIS } from '../src/infrastructure/redis/redis.constants';

describe('Health', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .overrideProvider(REDIS)
      .useValue({ ping: jest.fn(), quit: jest.fn() })
      .compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterAll(async () => app?.close());

  it('returns a liveness response', () =>
    request(app.getHttpServer()).get('/api/v1/health').expect(200).expect({ status: 'ok' }));
});
