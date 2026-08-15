import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL is not configured')
}

/**
 * An explicit Pool (instead of passing the URL string to drizzle) keeps
 * connections warm. The default constructor does create a Pool, but without
 * keepAlive every Next.js fan-out pays a fresh TCP handshake into Docker.
 */
export const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  keepAlive: true,
})

export const db = drizzle({ client: pool })
