import "server-only"

import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"

import * as schema from "@/lib/auth-schema"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

export const db = drizzle(pool, { schema })
