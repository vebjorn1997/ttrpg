import { Hono } from 'hono'
import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { factionsTable, factionTraitsTable } from '../db/schema/factions'
import { systemsTable } from '../db/schema/systems'
import { systemFactionsTable } from '../db/schema/systemRelationships'
import {
  attachViewer,
  isGameMaster,
  type ViewerVariables,
} from '../lib/internal-auth'
import { FACTION_TYPES } from '../lib/campaign-enums'
import {
  isUuid,
  parseEnum,
  parseNullableIntInRange,
  parseNullableText,
  parseNullableUuid,
  parseHexColor,
  parseStringList,
  parseText,
  parseUuidList,
  readJsonBody,
} from '../lib/campaign-parse'
import {
  assertTraitsExist,
  replaceTraitLinks,
  traitsByParent,
  type TraitRow,
} from '../lib/campaign-traits'
import { toFaction, toSystemRef } from '../lib/campaign-view'

const factions = new Hono<{ Variables: ViewerVariables }>()

factions.use('*', attachViewer)

const NO_TRAITS: TraitRow[] = []

function loadTraits(factionIds: string[]) {
  return traitsByParent(
    factionTraitsTable,
    factionTraitsTable.factionId,
    factionTraitsTable.traitId,
    factionIds,
  )
}

factions.get('/', async (c) => {
  const isGm = isGameMaster(c.get('viewerRole'))
  const search = c.req.query('search')?.trim()
  const type = c.req.query('type')?.trim()

  const filters: SQL[] = []
  if (search) {
    const like = `%${search}%`
    const match = or(
      ilike(factionsTable.name, like),
      ilike(factionsTable.description, like),
    )
    if (match) filters.push(match)
  }
  if (type) filters.push(eq(factionsTable.type, type as (typeof FACTION_TYPES)[number]))

  const rows = await db
    .select({ faction: factionsTable, headquarters: systemsTable })
    .from(factionsTable)
    .leftJoin(systemsTable, eq(systemsTable.id, factionsTable.headquartersSystemId))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(factionsTable.name))

  const traits = await loadTraits(rows.map((row) => row.faction.id))

  return c.json(
    rows.map(({ faction, headquarters }) =>
      toFaction(
        faction,
        traits.get(faction.id) ?? NO_TRAITS,
        isGm,
        headquarters ? toSystemRef(headquarters) : null,
      ),
    ),
  )
})

async function loadFactionDetail(id: string, isGm: boolean) {
  const [row] = await db
    .select({ faction: factionsTable, headquarters: systemsTable })
    .from(factionsTable)
    .leftJoin(systemsTable, eq(systemsTable.id, factionsTable.headquartersSystemId))
    .where(eq(factionsTable.id, id))
    .limit(1)

  if (!row) return null

  const traits = await loadTraits([id])

  const presenceRows = await db
    .select({ presence: systemFactionsTable, system: systemsTable })
    .from(systemFactionsTable)
    .innerJoin(systemsTable, eq(systemsTable.id, systemFactionsTable.systemId))
    .where(
      isGm
        ? eq(systemFactionsTable.factionId, id)
        : and(
            eq(systemFactionsTable.factionId, id),
            eq(systemFactionsTable.visibility, 'public'),
          ),
    )
    .orderBy(asc(systemsTable.name))

  const heldRows = await db
    .select({
      id: systemsTable.id,
      name: systemsTable.name,
      location: systemsTable.location,
    })
    .from(systemsTable)
    .where(eq(systemsTable.controllerFactionId, id))
    .orderBy(asc(systemsTable.name))

  return {
    ...toFaction(
      row.faction,
      traits.get(id) ?? NO_TRAITS,
      isGm,
      row.headquarters ? toSystemRef(row.headquarters) : null,
    ),
    controlledSystems: heldRows.map(toSystemRef),
    presences: presenceRows.map(({ presence, system }) => ({
      id: presence.id,
      system: toSystemRef(system),
      presenceType: presence.presenceType,
      influence: presence.influence,
      relationshipToParty: presence.relationshipToParty,
      notes: presence.notes,
      visibility: presence.visibility,
    })),
  }
}

factions.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Faction not found' }, 404)

  const detail = await loadFactionDetail(id, isGameMaster(c.get('viewerRole')))
  if (!detail) return c.json({ error: 'Faction not found' }, 404)

  return c.json(detail)
})

type FactionFields = {
  name: string
  type: (typeof FACTION_TYPES)[number]
  description: string | null
  tier: number | null
  headquartersSystemId: string | null
  goals: string | null
  assets: string[]
  color: string
  notes: string | null
  traitIds: string[]
}

async function parseFactionBody(
  body: Record<string, unknown>,
): Promise<{ ok: true; value: FactionFields } | { ok: false; error: string }> {
  const name = parseText(body.name, 'name', 150)
  if (!name.ok) return name

  const type =
    body.type === undefined
      ? ({ ok: true, value: 'other' } as const)
      : parseEnum(FACTION_TYPES, body.type, 'type')
  if (!type.ok) return type

  const description = parseNullableText(body.description, 'description')
  if (!description.ok) return description

  const tier = parseNullableIntInRange(body.tier, 'tier', 1, 5)
  if (!tier.ok) return tier

  const headquartersSystemId = parseNullableUuid(
    body.headquartersSystemId,
    'headquartersSystemId',
  )
  if (!headquartersSystemId.ok) return headquartersSystemId

  if (headquartersSystemId.value) {
    const [system] = await db
      .select({ id: systemsTable.id })
      .from(systemsTable)
      .where(eq(systemsTable.id, headquartersSystemId.value))
      .limit(1)
    if (!system) return { ok: false, error: 'Headquarters system not found' }
  }

  const goals = parseNullableText(body.goals, 'goals')
  if (!goals.ok) return goals

  const assets = parseStringList(body.assets, 'assets')
  if (!assets.ok) return assets

  const color =
    body.color === undefined || body.color === null || body.color === ''
      ? ({ ok: true, value: '#4a6d8c' } as const)
      : parseHexColor(body.color, 'color')
  if (!color.ok) return color

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return notes

  const traitIds = parseUuidList(body.traitIds, 'traitIds')
  if (!traitIds.ok) return traitIds

  const traitError = await assertTraitsExist(traitIds.value)
  if (traitError) return { ok: false, error: traitError }

  return {
    ok: true,
    value: {
      name: name.value,
      type: type.value,
      description: description.value,
      tier: tier.value,
      headquartersSystemId: headquartersSystemId.value,
      goals: goals.value,
      assets: assets.value,
      color: color.value,
      notes: notes.value,
      traitIds: traitIds.value,
    },
  }
}

factions.post('/', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseFactionBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [clash] = await db
    .select({ id: factionsTable.id })
    .from(factionsTable)
    .where(eq(factionsTable.name, fields.value.name))
    .limit(1)
  if (clash) return c.json({ error: 'A faction with that name already exists' }, 409)

  const [created] = await db
    .insert(factionsTable)
    .values({
      name: fields.value.name,
      type: fields.value.type,
      description: fields.value.description,
      tier: fields.value.tier,
      headquartersSystemId: fields.value.headquartersSystemId,
      goals: fields.value.goals,
      assets: fields.value.assets,
      color: fields.value.color,
      notes: fields.value.notes,
      createdBy: c.get('viewerId'),
    })
    .returning({ id: factionsTable.id })

  await replaceTraitLinks(
    factionTraitsTable,
    factionTraitsTable.factionId,
    'factionId',
    'traitId',
    created.id,
    fields.value.traitIds,
  )

  return c.json(await loadFactionDetail(created.id, true), 201)
})

factions.put('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Faction not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseFactionBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const clashes = await db
    .select({ id: factionsTable.id })
    .from(factionsTable)
    .where(eq(factionsTable.name, fields.value.name))
  if (clashes.some((row) => row.id !== id)) {
    return c.json({ error: 'A faction with that name already exists' }, 409)
  }

  const [updated] = await db
    .update(factionsTable)
    .set({
      name: fields.value.name,
      type: fields.value.type,
      description: fields.value.description,
      tier: fields.value.tier,
      headquartersSystemId: fields.value.headquartersSystemId,
      goals: fields.value.goals,
      assets: fields.value.assets,
      color: fields.value.color,
      notes: fields.value.notes,
      updatedAt: new Date(),
    })
    .where(eq(factionsTable.id, id))
    .returning({ id: factionsTable.id })

  if (!updated) return c.json({ error: 'Faction not found' }, 404)

  await replaceTraitLinks(
    factionTraitsTable,
    factionTraitsTable.factionId,
    'factionId',
    'traitId',
    id,
    fields.value.traitIds,
  )

  return c.json(await loadFactionDetail(id, true))
})

factions.delete('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Faction not found' }, 404)

  const [removed] = await db
    .delete(factionsTable)
    .where(eq(factionsTable.id, id))
    .returning({ id: factionsTable.id })

  if (!removed) return c.json({ error: 'Faction not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

export default factions
