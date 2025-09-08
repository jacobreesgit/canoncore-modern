import { drizzle } from 'drizzle-orm/neon-serverless'
import { neonConfig, Pool } from '@neondatabase/serverless'
import ws from 'ws'
import * as schema from '@/lib/db/schema'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Configure WebSocket for transaction support
neonConfig.webSocketConstructor = ws

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
export const db = drizzle(pool, { schema })