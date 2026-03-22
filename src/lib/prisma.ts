import { PrismaClient } from '@prisma/client'

// Prisma 7: URL passada diretamente no construtor (não mais no schema)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as ConstructorParameters<typeof PrismaClient>[0])

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
