import { Hono } from 'hono'
import { db } from '../db/client'
import { weaponsTraitsTable } from '../db/schema/weaponsTraits'

const weaponsTraits = new Hono()

weaponsTraits.get('/', async (c) => {
  const rows = await db.select().from(weaponsTraitsTable)
  return c.json(rows)
})

export default weaponsTraits
