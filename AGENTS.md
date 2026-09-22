# Agent guide

## Purpose and stack

Nexus is a NestJS, TypeScript, PostgreSQL, Prisma, Redis, BullMQ, Swagger, Jest, and Docker modular monolith for a multi-tenant SaaS backend.

## Conventions

- Understand existing code before modifying it.
- Keep features in `src/modules`, cross-cutting HTTP code in `src/common`, and external infrastructure in `src/infrastructure`.
- Keep business logic out of controllers; controllers handle HTTP and delegate application logic.
- Validate every external input and never trust client-provided organization or user IDs for authorization.
- Prefer dependency injection, strict TypeScript, and explicit responsibilities.
- Do not use `any` without a documented reason.
- Avoid unnecessary abstractions, N+1 queries, speculative functionality, and microservices.
- Explain architectural decisions that are not obvious.

## Commands and database rules

Use `npm run start:dev`, `npm run build`, `npm run lint`, `npm test`, and `npm run test:e2e`. Use Prisma migrations (`npm run db:migrate`) for schema changes. Never modify a migration after it has been applied or shared; use a new migration. Use transactions for operations that must be atomic.

## Security and testing

Never expose secrets, stack traces, database errors, or internal errors. Add tests for meaningful behavior and regression tests for bug fixes when practical. Do not log sensitive request bodies.
