import { Hono } from 'hono'
import { db } from '../db/client'
import { healingTable } from '../db/schema/healing'

const healing = new Hono()

healing.get('/', async (c) => {
  const rows = await db.select().from(healingTable)
  return c.json(rows)
})

export default healing
