import { Hono } from 'hono'
import { eq } from 'drizzle-orm'
import { db } from '../db/client'
import { npcCatalogTable, npcCatalogTraitsTable } from '../db/schema/npcCatalog'
import { traitsTable } from '../db/schema/traits'

const npcCatalog = new Hono()

npcCatalog.get('/', async (c) => {
  const rows = await db
    .select({
      npc: npcCatalogTable,
      trait: traitsTable,
    })
    .from(npcCatalogTable)
    .leftJoin(npcCatalogTraitsTable, eq(npcCatalogTraitsTable.npcCatalogId, npcCatalogTable.id))
    .leftJoin(traitsTable, eq(traitsTable.id, npcCatalogTraitsTable.traitId))

  const byId = new Map<string, Omit<typeof npcCatalogTable.$inferSelect, 'traits'> & { traits: (typeof traitsTable.$inferSelect)[] }>()

  for (const { npc, trait } of rows) {
    let entry = byId.get(npc.id)
    if (!entry) {
      const { traits: _unused, ...rest } = npc
      entry = { ...rest, traits: [] }
      byId.set(npc.id, entry)
    }
    if (trait) {
      entry.traits.push(trait)
    }
  }

  return c.json([...byId.values()])
})

export default npcCatalog
