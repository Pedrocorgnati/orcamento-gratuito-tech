import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function isNeonUrl(url: string | undefined) {
  if (!url) return false
  return /neon\.tech|supabase\.co/.test(url)
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (isNeonUrl(url)) {
    const { PrismaNeon } = require('@prisma/adapter-neon') as typeof import('@prisma/adapter-neon')
    return new PrismaClient({
      adapter: new PrismaNeon({ connectionString: url }),
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    })
  }
  const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg')
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
