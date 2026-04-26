import { PrismaClient } from '@prisma/client'

export function createSeedPrismaClient() {
  const url = process.env.DATABASE_URL
  const isNeon = !!url && /neon\.tech|supabase\.co/.test(url)
  const adapter = isNeon
    ? new (require('@prisma/adapter-neon').PrismaNeon)({ connectionString: url })
    : new (require('@prisma/adapter-pg').PrismaPg)({ connectionString: url })

  return new PrismaClient({ adapter })
}
