import { Hono } from 'hono'
import { db } from '../db/client'
import { traitsTable } from '../db/schema/traits'

const traits = new Hono()

traits.get('/', async (c) => {
  const rows = await db.select().from(traitsTable)
  return c.json(rows)
})

export default traits
