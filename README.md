# Nexus API

Production-oriented NestJS modular monolith foundation for a multi-tenant SaaS backend.

## Requirements

- Node.js current LTS and npm
- Docker and Docker Compose

## Initial setup

```bash
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run start:dev
```

## URLs

- API: http://localhost:3000/api/v1
- Swagger: http://localhost:3000/api/docs
- Liveness: http://localhost:3000/api/v1/health
- Readiness: http://localhost:3000/api/v1/health/ready

## Commands

`npm run build`, `npm run lint`, `npm test`, `npm run test:e2e`, `npm run test:cov`, `npm run format`, `npm run db:generate`, `npm run db:migrate`, `npm run db:studio`, `npm run docker:up`, and `npm run docker:down`.

## Architecture

The application is a modular monolith. `src/modules` owns features, `src/common` owns cross-cutting HTTP concerns, and `src/infrastructure` owns Prisma, Redis, and BullMQ connectivity. Authentication and business modules are intentionally not implemented yet.

Validation is strict at HTTP boundaries (`whitelist` plus `forbidNonWhitelisted`), errors use a consistent safe envelope, and every request receives an `x-request-id`. PostgreSQL and Redis are checked by the readiness endpoint; liveness does not depend on them.
