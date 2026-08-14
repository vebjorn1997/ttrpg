import { Hono } from 'hono'
import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { campaignNpcsTable, campaignNpcTraitsTable } from '../db/schema/campaignNpcs'
import { factionsTable } from '../db/schema/factions'
import { systemsTable } from '../db/schema/systems'
import { patronsTable } from '../db/schema/patrons'
import { systemNpcsTable } from '../db/schema/systemRelationships'
import {
  attachViewer,
  isGameMaster,
  type ViewerVariables,
} from '../lib/internal-auth'
import { NPC_STATUSES } from '../lib/campaign-enums'
import {
  isUuid,
  parseEnum,
  parseNullableText,
  parseNullableUpp,
  parseNullableUuid,
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
import { toCampaignNpc, toSystemRef } from '../lib/campaign-view'

const campaignNpcs = new Hono<{ Variables: ViewerVariables }>()

campaignNpcs.use('*', attachViewer)

const NO_TRAITS: TraitRow[] = []

function loadTraits(npcIds: string[]) {
  return traitsByParent(
    campaignNpcTraitsTable,
    campaignNpcTraitsTable.npcId,
    campaignNpcTraitsTable.traitId,
    npcIds,
  )
}

function baseQuery() {
  return db
    .select({
      npc: campaignNpcsTable,
      currentLocation: systemsTable,
      allegiance: factionsTable,
    })
    .from(campaignNpcsTable)
    .leftJoin(systemsTable, eq(systemsTable.id, campaignNpcsTable.currentLocationSystemId))
    .leftJoin(factionsTable, eq(factionsTable.id, campaignNpcsTable.allegianceFactionId))
}

campaignNpcs.get('/', async (c) => {
  const isGm = isGameMaster(c.get('viewerRole'))
  const search = c.req.query('search')?.trim()
  const status = c.req.query('status')?.trim()

  const filters: SQL[] = []
  if (search) {
    const like = `%${search}%`
    const match = or(
      ilike(campaignNpcsTable.name, like),
      ilike(campaignNpcsTable.occupation, like),
      ilike(campaignNpcsTable.description, like),
    )
    if (match) filters.push(match)
  }
  if (status) {
    filters.push(eq(campaignNpcsTable.status, status as (typeof NPC_STATUSES)[number]))
  }

  const rows = await baseQuery()
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(campaignNpcsTable.name))

  const traits = await loadTraits(rows.map((row) => row.npc.id))

  return c.json(
    rows.map(({ npc, currentLocation, allegiance }) =>
      toCampaignNpc(
        npc,
        traits.get(npc.id) ?? NO_TRAITS,
        isGm,
        currentLocation ? toSystemRef(currentLocation) : null,
        allegiance ? { id: allegiance.id, name: allegiance.name } : null,
      ),
    ),
  )
})

async function loadNpcDetail(id: string, isGm: boolean) {
  const [row] = await baseQuery().where(eq(campaignNpcsTable.id, id)).limit(1)
  if (!row) return null

  const traits = await loadTraits([id])

  const presenceRows = await db
    .select({ presence: systemNpcsTable, system: systemsTable })
    .from(systemNpcsTable)
    .innerJoin(systemsTable, eq(systemsTable.id, systemNpcsTable.systemId))
    .where(
      isGm
        ? eq(systemNpcsTable.npcId, id)
        : and(eq(systemNpcsTable.npcId, id), eq(systemNpcsTable.visibility, 'public')),
    )
    .orderBy(asc(systemsTable.name))

  const patronRoles = await db
    .select({ id: patronsTable.id, riskTolerance: patronsTable.riskTolerance })
    .from(patronsTable)
    .where(eq(patronsTable.npcId, id))

  return {
    ...toCampaignNpc(
      row.npc,
      traits.get(id) ?? NO_TRAITS,
      isGm,
      row.currentLocation ? toSystemRef(row.currentLocation) : null,
      row.allegiance ? { id: row.allegiance.id, name: row.allegiance.name } : null,
    ),
    presences: presenceRows.map(({ presence, system }) => ({
      id: presence.id,
      system: toSystemRef(system),
      connectionType: presence.connectionType,
      currentStatus: presence.currentStatus,
      arrivalDate: presence.arrivalDate,
      departureDate: presence.departureDate,
      notes: presence.notes,
      visibility: presence.visibility,
    })),
    patronRoles,
  }
}

campaignNpcs.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'NPC not found' }, 404)

  const detail = await loadNpcDetail(id, isGameMaster(c.get('viewerRole')))
  if (!detail) return c.json({ error: 'NPC not found' }, 404)

  return c.json(detail)
})

type NpcFields = {
  name: string
  occupation: string | null
  upp: string | null
  description: string | null
  currentLocationSystemId: string | null
  status: (typeof NPC_STATUSES)[number]
  allegianceFactionId: string | null
  notes: string | null
  traitIds: string[]
}

async function parseNpcBody(
  body: Record<string, unknown>,
): Promise<{ ok: true; value: NpcFields } | { ok: false; error: string }> {
  const name = parseText(body.name, 'name', 150)
  if (!name.ok) return name

  const occupation = parseNullableText(body.occupation, 'occupation', 100)
  if (!occupation.ok) return occupation

  const upp = parseNullableUpp(body.upp)
  if (!upp.ok) return upp

  const description = parseNullableText(body.description, 'description')
  if (!description.ok) return description

  const currentLocationSystemId = parseNullableUuid(
    body.currentLocationSystemId,
    'currentLocationSystemId',
  )
  if (!currentLocationSystemId.ok) return currentLocationSystemId

  if (currentLocationSystemId.value) {
    const [system] = await db
      .select({ id: systemsTable.id })
      .from(systemsTable)
      .where(eq(systemsTable.id, currentLocationSystemId.value))
      .limit(1)
    if (!system) return { ok: false, error: 'Current location system not found' }
  }

  const status =
    body.status === undefined
      ? ({ ok: true, value: 'alive' } as const)
      : parseEnum(NPC_STATUSES, body.status, 'status')
  if (!status.ok) return status

  const allegianceFactionId = parseNullableUuid(
    body.allegianceFactionId,
    'allegianceFactionId',
  )
  if (!allegianceFactionId.ok) return allegianceFactionId

  if (allegianceFactionId.value) {
    const [faction] = await db
      .select({ id: factionsTable.id })
      .from(factionsTable)
      .where(eq(factionsTable.id, allegianceFactionId.value))
      .limit(1)
    if (!faction) return { ok: false, error: 'Allegiance faction not found' }
  }

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
      occupation: occupation.value,
      upp: upp.value,
      description: description.value,
      currentLocationSystemId: currentLocationSystemId.value,
      status: status.value,
      allegianceFactionId: allegianceFactionId.value,
      notes: notes.value,
      traitIds: traitIds.value,
    },
  }
}

campaignNpcs.post('/', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseNpcBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [created] = await db
    .insert(campaignNpcsTable)
    .values({
      name: fields.value.name,
      occupation: fields.value.occupation,
      upp: fields.value.upp,
      description: fields.value.description,
      currentLocationSystemId: fields.value.currentLocationSystemId,
      status: fields.value.status,
      allegianceFactionId: fields.value.allegianceFactionId,
      notes: fields.value.notes,
      createdBy: c.get('viewerId'),
    })
    .returning({ id: campaignNpcsTable.id })

  await replaceTraitLinks(
    campaignNpcTraitsTable,
    campaignNpcTraitsTable.npcId,
    'npcId',
    'traitId',
    created.id,
    fields.value.traitIds,
  )

  return c.json(await loadNpcDetail(created.id, true), 201)
})

campaignNpcs.put('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'NPC not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseNpcBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [updated] = await db
    .update(campaignNpcsTable)
    .set({
      name: fields.value.name,
      occupation: fields.value.occupation,
      upp: fields.value.upp,
      description: fields.value.description,
      currentLocationSystemId: fields.value.currentLocationSystemId,
      status: fields.value.status,
      allegianceFactionId: fields.value.allegianceFactionId,
      notes: fields.value.notes,
      updatedAt: new Date(),
    })
    .where(eq(campaignNpcsTable.id, id))
    .returning({ id: campaignNpcsTable.id })

  if (!updated) return c.json({ error: 'NPC not found' }, 404)

  await replaceTraitLinks(
    campaignNpcTraitsTable,
    campaignNpcTraitsTable.npcId,
    'npcId',
    'traitId',
    id,
    fields.value.traitIds,
  )

  return c.json(await loadNpcDetail(id, true))
})

campaignNpcs.delete('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'NPC not found' }, 404)

  const [removed] = await db
    .delete(campaignNpcsTable)
    .where(eq(campaignNpcsTable.id, id))
    .returning({ id: campaignNpcsTable.id })

  if (!removed) return c.json({ error: 'NPC not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

export default campaignNpcs
