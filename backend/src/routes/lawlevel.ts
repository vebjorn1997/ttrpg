import { Hono } from 'hono'
import { asc } from 'drizzle-orm'
import { db } from '../db/client'
import { lawlevelTable } from '../db/schema/lawlevel'

const lawlevel = new Hono()

lawlevel.get('/', async (c) => {
  const rows = await db.select().from(lawlevelTable).orderBy(asc(lawlevelTable.lawlevel))
  return c.json(rows)
})

export default lawlevel
