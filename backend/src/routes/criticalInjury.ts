import { Hono } from 'hono'
import { db } from '../db/client'
import { criticalInjuryTable } from '../db/schema/criticalInjury'

const criticalInjury = new Hono()

criticalInjury.get('/', async (c) => {
  const rows = await db.select().from(criticalInjuryTable)
  return c.json(rows)
})

export default criticalInjury
