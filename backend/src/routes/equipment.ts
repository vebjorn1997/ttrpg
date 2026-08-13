import { Hono } from 'hono'
import { asc } from 'drizzle-orm'
import { db } from '../db/client'
import { equipmentTable } from '../db/schema/equipment'

const equipment = new Hono()

equipment.get('/', async (c) => {
  const rows = await db
    .select()
    .from(equipmentTable)
    .orderBy(asc(equipmentTable.type), asc(equipmentTable.name))
  return c.json(rows)
})

export default equipment
