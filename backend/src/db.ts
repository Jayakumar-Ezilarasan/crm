import { PrismaClient } from '@prisma/client';

// Prisma connection pooling is configured via the DATABASE_URL connection string.
// Example: postgresql://user:pass@host:5432/db?connection_limit=10

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Optional: handle process exit for graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma; 