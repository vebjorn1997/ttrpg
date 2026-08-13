import { Hono } from 'hono'
import { asc } from 'drizzle-orm'
import { db } from '../db/client'
import { miscellaneousTable } from '../db/schema/miscellaneous'

const miscellaneous = new Hono()

miscellaneous.get('/', async (c) => {
  const rows = await db.select().from(miscellaneousTable).orderBy(asc(miscellaneousTable.sort))
  return c.json(rows)
})

export default miscellaneous
