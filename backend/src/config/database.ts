import { PrismaClient } from '@prisma/client';

// Database connection pooling configuration
const prisma = new PrismaClient({
  log: process.env['NODE_ENV'] === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: process.env['DATABASE_URL'] || '',
    },
  },
});

// Database health check
export const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error: any) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database connections...');
  await prisma.$disconnect();
  process.exit(0);
});

export default prisma;


