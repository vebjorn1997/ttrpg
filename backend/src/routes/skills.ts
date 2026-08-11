import { Hono } from 'hono'
import { db } from '../db/client'
import { skillsTable } from '../db/schema/skills'

const skills = new Hono()

skills.get('/', async (c) => {
  const rows = await db.select().from(skillsTable)
  return c.json(rows)
})

export default skills
