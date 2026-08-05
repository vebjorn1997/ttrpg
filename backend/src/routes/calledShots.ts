import { Hono } from 'hono'
import { db } from '../db/client'
import { calledShotsTable } from '../db/schema/calledShots'

const calledShots = new Hono()

calledShots.get('/', async (c) => {
  const rows = await db.select().from(calledShotsTable)
  return c.json(rows)
})

export default calledShots
