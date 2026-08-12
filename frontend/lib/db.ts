import "server-only"

import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

import * as schema from "@/lib/auth-schema"

const connectionString = process.env.DATABASE_URL

const pool = new Pool({
  connectionString,
  // RDS requires TLS; rejectUnauthorized:false matches common sslmode=no-verify setups.
  // Prefer a proper CA bundle in production when you can.
  ssl: connectionString?.includes("localhost")
    ? undefined
    : { rejectUnauthorized: false },
})

export const db = drizzle(pool, { schema })
