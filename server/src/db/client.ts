import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | null };

function createPrismaClient(): PrismaClient | null {
  if (!process.env.DATABASE_URL) {
    console.warn('[DB] DATABASE_URL not set — database features disabled');
    return null;
  }
  try {
    const client = new PrismaClient();
    return client;
  } catch (e) {
    console.warn('[DB] Failed to initialize PrismaClient:', (e as Error).message);
    return null;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
