# Task: Set Up a Production-Ready NestJS Backend Project

You are working in a new repository that will become a production-oriented, multi-tenant SaaS backend.

Your task is to set up the project foundation and development environment only.

Do **not** implement the application's business features yet.

The project will eventually include:

- Authentication
- Users
- Organizations / multi-tenancy
- RBAC and permissions
- Projects
- Tasks
- Comments
- Attachments
- Activity/audit logs
- Notifications
- Redis caching
- BullMQ background jobs
- API keys
- Public API
- Rate limiting
- Webhooks
- Billing/payment providers
- Observability
- Automated testing
- Docker
- CI/CD
- AI/tool-calling features later

The immediate goal is to establish an architecture that can support these features without overengineering the initial application.

---

# 1. Technology Stack

Use:

- Node.js current LTS
- TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- BullMQ
- Swagger / OpenAPI
- Jest
- Supertest
- ESLint
- Prettier
- Docker
- Docker Compose

Use npm unless the repository already contains a different package manager configuration.

Do not introduce additional major frameworks or infrastructure unless there is a clear technical reason.

---

# 2. Architecture

Start as a **modular monolith**.

Do NOT create microservices.

Use feature-oriented modules rather than organizing the entire application by technical layer.

Target structure:

```text
src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── organizations/
│   ├── projects/
│   ├── tasks/
│   ├── notifications/
│   ├── webhooks/
│   ├── api-keys/
│   └── billing/
│
├── common/
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── pipes/
│   ├── constants/
│   └── types/
│
├── infrastructure/
│   ├── database/
│   ├── redis/
│   └── queue/
│
├── config/
│
├── app.module.ts
└── main.ts
```

This structure is a guideline rather than a requirement.

If NestJS conventions or the current project structure suggest a better organization, explain the change before making it.

Avoid unnecessary abstraction.

Do not create:

- repositories wrapping Prisma without a real need
- generic base services
- generic CRUD abstractions
- unnecessary interfaces
- CQRS infrastructure
- event sourcing
- microservices
- domain-driven-design ceremony

We can introduce abstractions later when actual requirements justify them.

---

# 3. NestJS Application

Initialize and configure the NestJS application.

Configure globally:

- API prefix `/api`
- URI API versioning
- global ValidationPipe
- transformation
- whitelist validation
- rejection of unexpected properties where appropriate
- global exception handling
- CORS using environment configuration
- graceful shutdown hooks

Use an API structure that supports:

```text
/api/v1/...
```

Do not implement application endpoints beyond basic infrastructure/health functionality.

---

# 4. Configuration

Use `@nestjs/config`.

Environment configuration must be centralized and validated at application startup.

Create:

```text
.env.example
```

Never commit actual secrets.

Expected configuration should include at minimum:

```env
NODE_ENV=development
PORT=3000

DATABASE_URL=

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGINS=http://localhost:3001
```

Add other variables only when required.

The application should fail fast when required environment variables are invalid or missing.

Do not access `process.env` throughout business code.

---

# 5. PostgreSQL + Prisma

Install and configure Prisma for PostgreSQL.

Create the database infrastructure required for dependency injection.

There should be one clean mechanism through which NestJS services access Prisma.

Do not create the complete application schema yet.

Only create enough database configuration to prove that:

```text
NestJS
   ↓
Prisma
   ↓
PostgreSQL
```

works correctly.

Set up migration commands/scripts.

Useful scripts should include equivalents of:

```bash
npm run db:migrate
npm run db:generate
npm run db:studio
```

Use Prisma migrations rather than `db push` as the normal development workflow.

---

# 6. Redis

Configure Redis connectivity.

Create infrastructure that can later support:

- caching
- rate limiting
- distributed locks
- BullMQ
- idempotency

Do not build those features yet.

Keep Redis infrastructure isolated from business modules.

---

# 7. BullMQ

Install and configure BullMQ using Redis.

Create only the base queue infrastructure.

Do not create fake business jobs just to demonstrate queues.

The architecture should make it straightforward to add workers later.

---

# 8. Swagger / OpenAPI

Configure Swagger.

Expose documentation at:

```text
/api/docs
```

Configure:

- API title
- version
- description
- bearer authentication support
- API versioning compatibility

Swagger should work automatically with future DTOs and controllers.

---

# 9. Validation

Use NestJS DTO validation.

Configure:

```ts
ValidationPipe({
  whitelist: true,
  transform: true,
})
```

Consider whether `forbidNonWhitelisted` should be enabled and explain the decision.

DTOs should be used at API boundaries.

Do not use Prisma-generated types directly as request DTOs.

---

# 10. Error Handling

Create a consistent API error format.

Target something similar to:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "details": [],
  "path": "/api/v1/example",
  "timestamp": "..."
}
```

Do not leak:

- stack traces
- database errors
- internal implementation details
- secrets

Development logging may contain additional debugging information.

---

# 11. Logging

Set up structured application logging.

Every request should eventually be traceable through a request/correlation ID.

For now, establish:

```text
incoming request
      ↓
request ID
      ↓
NestJS
      ↓
logs
```

Avoid unnecessary logging of request bodies because future requests may contain passwords, tokens, payment data, or other sensitive information.

Do not build a complex observability stack yet.

---

# 12. Health Checks

Create a basic health module.

Provide:

```http
GET /api/v1/health
```

The health system should be designed so PostgreSQL and Redis readiness checks can be included.

Distinguish where useful between:

```text
liveness
readiness
```

Do not expose sensitive infrastructure information publicly.

---

# 13. Security Foundation

Install/configure reasonable HTTP security defaults.

Consider:

- Helmet
- CORS
- request size limits
- validation
- secure error handling

Do not implement authentication yet.

Do not add security libraries merely for the sake of having them.

Explain security-related configuration choices.

---

# 14. Testing

Configure testing properly.

Support:

```text
unit tests
integration tests
E2E tests
```

Create a minimal E2E test proving that the application boots and the health endpoint works.

Do not write fake tests purely to increase coverage.

Add scripts such as:

```bash
npm test
npm run test:e2e
npm run test:cov
```

---

# 15. Docker

Create:

```text
Dockerfile
docker-compose.yml
.dockerignore
```

Docker Compose should provide at least:

```text
PostgreSQL
Redis
```

Prefer running the NestJS application locally during development unless there is a strong reason to containerize the development server too.

The expected local workflow should be approximately:

```bash
docker compose up -d
npm install
npm run db:migrate
npm run start:dev
```

Make database and Redis data persistent through Docker volumes.

Add appropriate health checks where practical.

---

# 16. Code Quality

Configure:

- ESLint
- Prettier
- strict TypeScript
- sensible path aliases if they improve readability

Avoid disabling TypeScript or ESLint rules simply to silence errors.

Prefer fixing the underlying issue.

The following should succeed:

```bash
npm run lint
npm run build
npm test
npm run test:e2e
```

---

# 17. Git

Create/update:

```text
.gitignore
```

Ensure these are excluded where appropriate:

```text
node_modules
dist
.env
coverage
logs
IDE-specific files
OS-generated files
```

Do not ignore:

```text
.env.example
```

Do not commit secrets.

Do not make a Git commit unless explicitly asked.

---

# 18. Developer Experience

Add useful npm scripts for common workflows.

Examples:

```text
start:dev
build
lint
format
test
test:e2e
test:cov

db:generate
db:migrate
db:studio

docker:up
docker:down
```

Keep script names predictable and document them.

---

# 19. Documentation

Create a useful `README.md`.

It should explain:

## Requirements

- Node.js
- npm
- Docker

## Initial setup

Example:

```bash
git clone ...
cd ...
npm install
cp .env.example .env
docker compose up -d
npm run db:migrate
npm run start:dev
```

## Important URLs

For example:

```text
API:
http://localhost:3000/api/v1

Swagger:
http://localhost:3000/api/docs

Health:
http://localhost:3000/api/v1/health
```

## Common commands

Document:

- development
- tests
- linting
- Prisma
- Docker

Also include a short architecture overview.

---

# 20. AGENTS.md

Create an `AGENTS.md` file for future coding agents.

It should explain:

- project purpose
- technology stack
- architecture
- folder conventions
- commands
- testing expectations
- database migration rules
- coding conventions
- security expectations

Include rules such as:

1. Understand existing code before modifying it.
2. Follow existing NestJS conventions.
3. Keep business logic out of controllers.
4. Controllers should handle HTTP concerns and delegate application logic.
5. Validate all external input.
6. Never trust client-provided organization/user IDs for authorization.
7. Never expose secrets or internal errors.
8. Do not use `any` unless there is a documented reason.
9. Avoid unnecessary abstractions.
10. Prefer dependency injection over manually constructing dependencies.
11. Add tests for meaningful behavior.
12. Every bug fix should include a regression test when practical.
13. Use Prisma migrations for schema changes.
14. Do not modify existing migrations after they have been applied/shared.
15. Avoid N+1 database queries.
16. Use transactions when an operation must be atomic.
17. Do not introduce a dependency without explaining why it is needed.
18. Do not create microservices unless explicitly requested.
19. Do not implement speculative functionality.
20. Keep modules loosely coupled and responsibilities explicit.

Also instruct future agents to explain architectural decisions that are not obvious.

---

# 21. Architecture Decision Records

Create:

```text
docs/
└── architecture/
    └── README.md
```

Document important initial decisions briefly:

```text
Why NestJS?
Why PostgreSQL?
Why Prisma?
Why Redis?
Why BullMQ?
Why modular monolith?
```

Do not turn this into excessive documentation.

The purpose is to make architectural reasoning visible.

---

# 22. Do Not Implement Yet

Do NOT implement:

- registration
- login
- JWT authentication
- refresh tokens
- organizations
- permissions
- projects
- tasks
- billing
- webhooks
- API keys
- notifications
- AI features

Those will be separate learning milestones.

This task is infrastructure/setup only.

---

# 23. Verification

Before considering the task complete, actually run the relevant commands.

Verify:

```bash
npm install
npm run build
npm run lint
npm test
npm run test:e2e
```

Start Docker dependencies and verify:

```bash
docker compose up -d
```

Verify PostgreSQL connectivity.

Verify Redis connectivity.

Verify Prisma migrations.

Run the application and verify:

```http
GET /api/v1/health
```

Verify Swagger loads at:

```text
/api/docs
```

Do not claim something works unless you actually verified it.

If something cannot be verified because of an environment limitation, explicitly state what was not verified and why.

---

# 24. Working Method

Before changing files:

1. Inspect the repository.
2. Determine whether a NestJS project already exists.
3. Inspect package manager/configuration files.
4. Present a short implementation plan.
5. Then perform the setup.

Do not overwrite useful existing configuration blindly.

While working:

- make small, coherent changes
- resolve errors rather than working around them
- avoid premature abstractions
- keep dependencies minimal
- follow current official NestJS/Prisma conventions

If a technical decision has multiple reasonable options, choose the simplest production-appropriate option and document why.

---

# 25. Final Report

When finished, provide:

### Created

List important files/modules created.

### Dependencies

List important dependencies added and why they are needed.

### Architecture

Briefly explain the resulting architecture.

### Verification

Show which commands were actually executed and their results.

### Running Locally

Provide the exact commands required to start the project.

### Next Step

Do **not** implement it, but identify the next milestone as:

> Authentication foundation: User model, registration, password hashing, login, JWT access tokens, refresh-token rotation, `/auth/me`, and logout.

Do not proceed to that milestone until explicitly instructed.