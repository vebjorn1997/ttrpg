import { Hono } from 'hono'
import { and, asc, eq, ilike, or, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import { shipsTable, shipTraitsTable } from '../db/schema/ships'
import { factionsTable } from '../db/schema/factions'
import { campaignNpcsTable } from '../db/schema/campaignNpcs'
import { systemsTable } from '../db/schema/systems'
import { systemShipsTable } from '../db/schema/systemRelationships'
import {
  attachViewer,
  isGameMaster,
  type ViewerVariables,
} from '../lib/internal-auth'
import { SHIP_STATUSES } from '../lib/campaign-enums'
import {
  isUuid,
  parseEnum,
  parseNullableText,
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
import { toShip, toSystemRef } from '../lib/campaign-view'

const ships = new Hono<{ Variables: ViewerVariables }>()

ships.use('*', attachViewer)

const NO_TRAITS: TraitRow[] = []

function loadTraits(shipIds: string[]) {
  return traitsByParent(
    shipTraitsTable,
    shipTraitsTable.shipId,
    shipTraitsTable.traitId,
    shipIds,
  )
}

function baseQuery() {
  return db
    .select({
      ship: shipsTable,
      ownerFaction: factionsTable,
      ownerNpc: campaignNpcsTable,
      currentSystem: systemsTable,
    })
    .from(shipsTable)
    .leftJoin(factionsTable, eq(factionsTable.id, shipsTable.ownerFactionId))
    .leftJoin(campaignNpcsTable, eq(campaignNpcsTable.id, shipsTable.ownerNpcId))
    .leftJoin(systemsTable, eq(systemsTable.id, shipsTable.currentSystemId))
}

ships.get('/', async (c) => {
  const isGm = isGameMaster(c.get('viewerRole'))
  const search = c.req.query('search')?.trim()
  const status = c.req.query('status')?.trim()

  const filters: SQL[] = []
  if (search) {
    const like = `%${search}%`
    const match = or(
      ilike(shipsTable.name, like),
      ilike(shipsTable.type, like),
      ilike(shipsTable.registration, like),
    )
    if (match) filters.push(match)
  }
  if (status) {
    filters.push(eq(shipsTable.status, status as (typeof SHIP_STATUSES)[number]))
  }

  const rows = await baseQuery()
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(asc(shipsTable.name))

  const traits = await loadTraits(rows.map((row) => row.ship.id))

  return c.json(
    rows.map(({ ship, ownerFaction, ownerNpc, currentSystem }) =>
      toShip(
        ship,
        traits.get(ship.id) ?? NO_TRAITS,
        isGm,
        ownerFaction ? { id: ownerFaction.id, name: ownerFaction.name } : null,
        ownerNpc ? { id: ownerNpc.id, name: ownerNpc.name } : null,
        currentSystem ? toSystemRef(currentSystem) : null,
      ),
    ),
  )
})

async function loadShipDetail(id: string, isGm: boolean) {
  const [row] = await baseQuery().where(eq(shipsTable.id, id)).limit(1)
  if (!row) return null

  const traits = await loadTraits([id])

  const visitRows = await db
    .select({ visit: systemShipsTable, system: systemsTable })
    .from(systemShipsTable)
    .innerJoin(systemsTable, eq(systemsTable.id, systemShipsTable.systemId))
    .where(
      isGm
        ? eq(systemShipsTable.shipId, id)
        : and(eq(systemShipsTable.shipId, id), eq(systemShipsTable.visibility, 'public')),
    )
    .orderBy(asc(systemsTable.name))

  return {
    ...toShip(
      row.ship,
      traits.get(id) ?? NO_TRAITS,
      isGm,
      row.ownerFaction ? { id: row.ownerFaction.id, name: row.ownerFaction.name } : null,
      row.ownerNpc ? { id: row.ownerNpc.id, name: row.ownerNpc.name } : null,
      row.currentSystem ? toSystemRef(row.currentSystem) : null,
    ),
    visits: visitRows.map(({ visit, system }) => ({
      id: visit.id,
      system: toSystemRef(system),
      arrivalDate: visit.arrivalDate,
      departureDate: visit.departureDate,
      purpose: visit.purpose,
      status: visit.status,
      notes: visit.notes,
      visibility: visit.visibility,
    })),
  }
}

ships.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Ship not found' }, 404)

  const detail = await loadShipDetail(id, isGameMaster(c.get('viewerRole')))
  if (!detail) return c.json({ error: 'Ship not found' }, 404)

  return c.json(detail)
})

type ShipFields = {
  name: string
  type: string | null
  registration: string | null
  ownerFactionId: string | null
  ownerNpcId: string | null
  currentSystemId: string | null
  status: (typeof SHIP_STATUSES)[number]
  notes: string | null
  traitIds: string[]
}

async function parseShipBody(
  body: Record<string, unknown>,
): Promise<{ ok: true; value: ShipFields } | { ok: false; error: string }> {
  const name = parseText(body.name, 'name', 150)
  if (!name.ok) return name

  const type = parseNullableText(body.type, 'type', 100)
  if (!type.ok) return type

  const registration = parseNullableText(body.registration, 'registration', 50)
  if (!registration.ok) return registration

  const ownerFactionId = parseNullableUuid(body.ownerFactionId, 'ownerFactionId')
  if (!ownerFactionId.ok) return ownerFactionId
  if (ownerFactionId.value) {
    const [faction] = await db
      .select({ id: factionsTable.id })
      .from(factionsTable)
      .where(eq(factionsTable.id, ownerFactionId.value))
      .limit(1)
    if (!faction) return { ok: false, error: 'Owning faction not found' }
  }

  const ownerNpcId = parseNullableUuid(body.ownerNpcId, 'ownerNpcId')
  if (!ownerNpcId.ok) return ownerNpcId
  if (ownerNpcId.value) {
    const [npc] = await db
      .select({ id: campaignNpcsTable.id })
      .from(campaignNpcsTable)
      .where(eq(campaignNpcsTable.id, ownerNpcId.value))
      .limit(1)
    if (!npc) return { ok: false, error: 'Owning NPC not found' }
  }

  const currentSystemId = parseNullableUuid(body.currentSystemId, 'currentSystemId')
  if (!currentSystemId.ok) return currentSystemId
  if (currentSystemId.value) {
    const [system] = await db
      .select({ id: systemsTable.id })
      .from(systemsTable)
      .where(eq(systemsTable.id, currentSystemId.value))
      .limit(1)
    if (!system) return { ok: false, error: 'Current system not found' }
  }

  const status =
    body.status === undefined
      ? ({ ok: true, value: 'active' } as const)
      : parseEnum(SHIP_STATUSES, body.status, 'status')
  if (!status.ok) return status

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
      registration: registration.value,
      ownerFactionId: ownerFactionId.value,
      ownerNpcId: ownerNpcId.value,
      currentSystemId: currentSystemId.value,
      status: status.value,
      notes: notes.value,
      traitIds: traitIds.value,
    },
  }
}

ships.post('/', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseShipBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [created] = await db
    .insert(shipsTable)
    .values({
      name: fields.value.name,
      type: fields.value.type,
      registration: fields.value.registration,
      ownerFactionId: fields.value.ownerFactionId,
      ownerNpcId: fields.value.ownerNpcId,
      currentSystemId: fields.value.currentSystemId,
      status: fields.value.status,
      notes: fields.value.notes,
      createdBy: c.get('viewerId'),
    })
    .returning({ id: shipsTable.id })

  await replaceTraitLinks(
    shipTraitsTable,
    shipTraitsTable.shipId,
    'shipId',
    'traitId',
    created.id,
    fields.value.traitIds,
  )

  return c.json(await loadShipDetail(created.id, true), 201)
})

ships.put('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Ship not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseShipBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [updated] = await db
    .update(shipsTable)
    .set({
      name: fields.value.name,
      type: fields.value.type,
      registration: fields.value.registration,
      ownerFactionId: fields.value.ownerFactionId,
      ownerNpcId: fields.value.ownerNpcId,
      currentSystemId: fields.value.currentSystemId,
      status: fields.value.status,
      notes: fields.value.notes,
      updatedAt: new Date(),
    })
    .where(eq(shipsTable.id, id))
    .returning({ id: shipsTable.id })

  if (!updated) return c.json({ error: 'Ship not found' }, 404)

  await replaceTraitLinks(
    shipTraitsTable,
    shipTraitsTable.shipId,
    'shipId',
    'traitId',
    id,
    fields.value.traitIds,
  )

  return c.json(await loadShipDetail(id, true))
})

ships.delete('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Ship not found' }, 404)

  const [removed] = await db
    .delete(shipsTable)
    .where(eq(shipsTable.id, id))
    .returning({ id: shipsTable.id })

  if (!removed) return c.json({ error: 'Ship not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

export default ships
