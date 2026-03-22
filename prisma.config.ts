import path from 'node:path'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma/schema.prisma'),
  migrate: {
    async adapter() {
      const { PrismaNeon } = await import('@prisma/adapter-neon')
      return new PrismaNeon({
        connectionString: process.env.DIRECT_URL,
      })
    },
  },
})
