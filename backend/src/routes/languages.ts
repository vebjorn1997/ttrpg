import { Hono } from 'hono'
import { db } from '../db/client'
import { languagesTable } from '../db/schema/languages'

const languages = new Hono()

languages.get('/', async (c) => {
  const rows = await db.select().from(languagesTable)
  return c.json(rows)
})

export default languages
