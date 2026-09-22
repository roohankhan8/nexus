process.env.DATABASE_URL ??= 'postgresql://nexus:nexus@localhost:5432/nexus?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'a'.repeat(32);
process.env.JWT_REFRESH_SECRET ??= 'b'.repeat(32);
