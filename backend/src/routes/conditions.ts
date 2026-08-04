import { Hono } from 'hono'
import { db } from '../db/client'
import { conditionsTable } from '../db/schema/conditions'

const conditions = new Hono()

conditions.get('/', async (c) => {
  const rows = await db.select().from(conditionsTable)
  return c.json(rows)
})

export default conditions
