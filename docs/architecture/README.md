# Architecture decisions

- **NestJS:** provides conventions, dependency injection, modules, validation, and a clear path from a small foundation to a larger API.
- **PostgreSQL:** a durable relational store suited to tenant boundaries, transactions, and reporting.
- **Prisma:** typed database access and migrations without a repository abstraction that is not yet needed.
- **Redis:** one shared infrastructure dependency for future caching, rate limits, locks, idempotency, and queues.
- **BullMQ:** durable Redis-backed background jobs when asynchronous work is introduced.
- **Modular monolith:** keeps deployment simple while feature modules establish boundaries that can evolve later.

The foundation deliberately excludes business models, authentication, and speculative abstractions.
