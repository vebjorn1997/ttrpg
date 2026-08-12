import { Hono } from 'hono'
import { asc } from 'drizzle-orm'
import { db } from '../db/client'
import { tlTable } from '../db/schema/tl'

const tl = new Hono()

tl.get('/', async (c) => {
  const rows = await db.select().from(tlTable).orderBy(asc(tlTable.level))
  return c.json(rows)
})

export default tl
