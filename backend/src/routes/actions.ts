import { Hono } from 'hono'
import { db } from '../db/client'
import { actionsTable } from '../db/schema/actions'

const actions = new Hono()

actions.get('/', async (c) => {
  const rows = await db.select().from(actionsTable)
  return c.json(rows)
})

export default actions
