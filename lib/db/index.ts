import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'

// Create database connection - use a mock connection URL during build if DATABASE_URL is missing
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://build:build@localhost:5432/build'
const sql = neon(databaseUrl)
export const db = drizzle(sql, { schema })
