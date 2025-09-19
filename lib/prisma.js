const { PrismaClient } = require('@prisma/client');

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__globalPrisma ?? new PrismaClient({
  log: ['query', 'error', 'warn'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__globalPrisma = prisma;
}

module.exports = prisma;
