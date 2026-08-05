import { Hono } from 'hono'
import { db } from '../db/client'
import { featsTable } from '../db/schema/feats'

const feats = new Hono()

feats.get('/', async (c) => {
  const rows = await db.select().from(featsTable)
  return c.json(rows)
})

export default feats
