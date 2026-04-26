import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { config as loadDotenv } from 'dotenv'

// Carrega .env.local primeiro (override), depois .env como fallback.
loadDotenv({ path: path.join(__dirname, '.env.local'), override: true })
loadDotenv({ path: path.join(__dirname, '.env') })

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
  migrate: {
    async adapter() {
      const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
      if (url && /neon\.tech|supabase\.co/.test(url)) {
        const { PrismaNeon } = await import('@prisma/adapter-neon')
        return new PrismaNeon({ connectionString: url })
      }
      const { PrismaPg } = await import('@prisma/adapter-pg')
      return new PrismaPg({ connectionString: url })
    },
  },
})
