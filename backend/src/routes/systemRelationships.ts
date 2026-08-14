/**
 * Relationship endpoints scoped to a system: `/:id/factions`, `/:id/npcs`, and
 * so on. Mounted inside the systems router, which supplies `attachViewer`.
 *
 * Reads honour the caller's visibility tier; every write is Game Master only.
 */

import { Hono, type Context } from 'hono'
import { and, eq, or } from 'drizzle-orm'
import { db } from '../db/client'
import { systemsTable } from '../db/schema/systems'
import { factionsTable } from '../db/schema/factions'
import { campaignNpcsTable } from '../db/schema/campaignNpcs'
import { shipsTable } from '../db/schema/ships'
import { patronsTable } from '../db/schema/patrons'
import { locationsTable, locationTraitsTable } from '../db/schema/locations'
import {
  systemFactionsTable,
  systemLinksTable,
  systemNpcsTable,
  systemPatronsTable,
  systemShipsTable,
} from '../db/schema/systemRelationships'
import { isGameMaster, type ViewerVariables } from '../lib/internal-auth'
import {
  JOB_DIFFICULTIES,
  LEGAL_STATUSES,
  LOCATION_TYPES,
  NPC_CONNECTION_TYPES,
  PARTY_RELATIONSHIPS,
  PATRON_AVAILABILITIES,
  PRESENCE_TYPES,
  SHIP_VISIT_PURPOSES,
  SHIP_VISIT_STATUSES,
  SYSTEM_LINK_TYPES,
  VISIBILITIES,
} from '../lib/campaign-enums'
import {
  isUuid,
  parseBoolean,
  parseEnum,
  parseIntInRange,
  parseNullableEnum,
  parseNullableIntInRange,
  parseNullableIsoDate,
  parseNullableText,
  parseNullableUuid,
  parseText,
  parseUuid,
  parseUuidList,
  readJsonBody,
  type Parsed,
} from '../lib/campaign-parse'
import { assertTraitsExist, replaceTraitLinks } from '../lib/campaign-traits'
import {
  loadSystemConnections,
  loadSystemFactions,
  loadSystemLocations,
  loadSystemNpcs,
  loadSystemPatrons,
  loadSystemShips,
} from '../lib/campaign-relationships'

const relationships = new Hono<{ Variables: ViewerVariables }>()

/* -------------------------------------------------------------------------- */
/* Shared guards                                                              */
/* -------------------------------------------------------------------------- */

async function systemExists(id: string): Promise<boolean> {
  if (!isUuid(id)) return false
  const [row] = await db
    .select({ id: systemsTable.id })
    .from(systemsTable)
    .where(eq(systemsTable.id, id))
    .limit(1)
  return Boolean(row)
}

/** Confirm a referenced entity row exists before linking to it. */
async function entityExists(
  table:
    | typeof factionsTable
    | typeof campaignNpcsTable
    | typeof shipsTable
    | typeof patronsTable
    | typeof locationsTable
    | typeof systemsTable,
  id: string,
): Promise<boolean> {
  const [row] = await db.select({ id: table.id }).from(table).where(eq(table.id, id)).limit(1)
  return Boolean(row)
}

type ViewerContext = Context<{ Variables: ViewerVariables }>

type Failure = { status: 400 | 403 | 404; error: string }

/** Common preamble for a GM write against a system-scoped collection. */
async function gmWriteContext(
  c: ViewerContext,
): Promise<
  | { ok: true; systemId: string; body: Record<string, unknown>; viewerId: string | null }
  | { ok: false; failure: Failure }
> {
  if (!isGameMaster(c.get('viewerRole'))) {
    return { ok: false, failure: { status: 403, error: 'Game Master access required' } }
  }

  const systemId = c.req.param('id') ?? ''
  if (!(await systemExists(systemId))) {
    return { ok: false, failure: { status: 404, error: 'System not found' } }
  }

  const body = await readJsonBody(c.req)
  if (!body) {
    return { ok: false, failure: { status: 400, error: 'Invalid JSON body' } }
  }

  return { ok: true, systemId, body, viewerId: c.get('viewerId') }
}

/** Apply a parsed value to a patch object, short-circuiting on the first error. */
function assign<T>(
  patch: Record<string, unknown>,
  key: string,
  result: Parsed<T>,
): string | null {
  if (!result.ok) return result.error
  patch[key] = result.value
  return null
}

/* -------------------------------------------------------------------------- */
/* Faction presences                                                          */
/* -------------------------------------------------------------------------- */

relationships.get('/:id/factions', async (c) => {
  const id = c.req.param('id')
  if (!(await systemExists(id))) return c.json({ error: 'System not found' }, 404)
  return c.json(await loadSystemFactions(id, isGameMaster(c.get('viewerRole'))))
})

relationships.post('/:id/factions', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body, viewerId } = ctx

  const factionId = parseUuid(body.factionId, 'factionId')
  if (!factionId.ok) return c.json({ error: factionId.error }, 400)
  if (!(await entityExists(factionsTable, factionId.value))) {
    return c.json({ error: 'Faction not found' }, 404)
  }

  const presenceType = parseEnum(PRESENCE_TYPES, body.presenceType, 'presenceType')
  if (!presenceType.ok) return c.json({ error: presenceType.error }, 400)

  const influence =
    body.influence === undefined
      ? { ok: true as const, value: 3 }
      : parseIntInRange(body.influence, 'influence', 0, 5)
  if (!influence.ok) return c.json({ error: influence.error }, 400)

  const relationshipToParty =
    body.relationshipToParty === undefined
      ? { ok: true as const, value: 'neutral' as const }
      : parseEnum(PARTY_RELATIONSHIPS, body.relationshipToParty, 'relationshipToParty')
  if (!relationshipToParty.ok) return c.json({ error: relationshipToParty.error }, 400)

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return c.json({ error: notes.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'public' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  const [clash] = await db
    .select({ id: systemFactionsTable.id })
    .from(systemFactionsTable)
    .where(
      and(
        eq(systemFactionsTable.systemId, systemId),
        eq(systemFactionsTable.factionId, factionId.value),
      ),
    )
    .limit(1)
  if (clash) {
    return c.json({ error: 'That faction already has a presence in this system' }, 409)
  }

  await db.insert(systemFactionsTable).values({
    systemId,
    factionId: factionId.value,
    presenceType: presenceType.value,
    influence: influence.value,
    relationshipToParty: relationshipToParty.value,
    notes: notes.value,
    visibility: visibility.value,
    createdBy: viewerId,
  })

  return c.json(await loadSystemFactions(systemId, true), 201)
})

relationships.put('/:id/factions/:presenceId', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body } = ctx

  const presenceId = c.req.param('presenceId')
  if (!isUuid(presenceId)) return c.json({ error: 'Faction presence not found' }, 404)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  let error: string | null = null

  if (body.presenceType !== undefined) {
    error ??= assign(patch, 'presenceType', parseEnum(PRESENCE_TYPES, body.presenceType, 'presenceType'))
  }
  if (body.influence !== undefined) {
    error ??= assign(patch, 'influence', parseIntInRange(body.influence, 'influence', 0, 5))
  }
  if (body.relationshipToParty !== undefined) {
    error ??= assign(
      patch,
      'relationshipToParty',
      parseEnum(PARTY_RELATIONSHIPS, body.relationshipToParty, 'relationshipToParty'),
    )
  }
  if (body.notes !== undefined) {
    error ??= assign(patch, 'notes', parseNullableText(body.notes, 'notes'))
  }
  if (body.visibility !== undefined) {
    error ??= assign(patch, 'visibility', parseEnum(VISIBILITIES, body.visibility, 'visibility'))
  }
  if (error) return c.json({ error }, 400)

  const [updated] = await db
    .update(systemFactionsTable)
    .set(patch)
    .where(
      and(eq(systemFactionsTable.id, presenceId), eq(systemFactionsTable.systemId, systemId)),
    )
    .returning({ id: systemFactionsTable.id })

  if (!updated) return c.json({ error: 'Faction presence not found' }, 404)
  return c.json(await loadSystemFactions(systemId, true))
})

relationships.delete('/:id/factions/:presenceId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }
  const systemId = c.req.param('id')
  const presenceId = c.req.param('presenceId')
  if (!isUuid(systemId) || !isUuid(presenceId)) {
    return c.json({ error: 'Faction presence not found' }, 404)
  }

  const [removed] = await db
    .delete(systemFactionsTable)
    .where(
      and(eq(systemFactionsTable.id, presenceId), eq(systemFactionsTable.systemId, systemId)),
    )
    .returning({ id: systemFactionsTable.id })

  if (!removed) return c.json({ error: 'Faction presence not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* NPC presences                                                              */
/* -------------------------------------------------------------------------- */

relationships.get('/:id/npcs', async (c) => {
  const id = c.req.param('id')
  if (!(await systemExists(id))) return c.json({ error: 'System not found' }, 404)
  return c.json(await loadSystemNpcs(id, isGameMaster(c.get('viewerRole'))))
})

relationships.post('/:id/npcs', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body, viewerId } = ctx

  const npcId = parseUuid(body.npcId, 'npcId')
  if (!npcId.ok) return c.json({ error: npcId.error }, 400)
  if (!(await entityExists(campaignNpcsTable, npcId.value))) {
    return c.json({ error: 'NPC not found' }, 404)
  }

  const connectionType = parseEnum(NPC_CONNECTION_TYPES, body.connectionType, 'connectionType')
  if (!connectionType.ok) return c.json({ error: connectionType.error }, 400)

  const currentStatus = parseNullableText(body.currentStatus, 'currentStatus', 100)
  if (!currentStatus.ok) return c.json({ error: currentStatus.error }, 400)

  const arrivalDate = parseNullableIsoDate(body.arrivalDate, 'arrivalDate')
  if (!arrivalDate.ok) return c.json({ error: arrivalDate.error }, 400)

  const departureDate = parseNullableIsoDate(body.departureDate, 'departureDate')
  if (!departureDate.ok) return c.json({ error: departureDate.error }, 400)

  if (arrivalDate.value && departureDate.value && departureDate.value < arrivalDate.value) {
    return c.json({ error: 'departureDate cannot be before arrivalDate' }, 400)
  }

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return c.json({ error: notes.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'public' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  await db.insert(systemNpcsTable).values({
    systemId,
    npcId: npcId.value,
    connectionType: connectionType.value,
    currentStatus: currentStatus.value,
    arrivalDate: arrivalDate.value,
    departureDate: departureDate.value,
    notes: notes.value,
    visibility: visibility.value,
    createdBy: viewerId,
  })

  return c.json(await loadSystemNpcs(systemId, true), 201)
})

relationships.put('/:id/npcs/:presenceId', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body } = ctx

  const presenceId = c.req.param('presenceId')
  if (!isUuid(presenceId)) return c.json({ error: 'NPC presence not found' }, 404)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  let error: string | null = null

  if (body.connectionType !== undefined) {
    error ??= assign(
      patch,
      'connectionType',
      parseEnum(NPC_CONNECTION_TYPES, body.connectionType, 'connectionType'),
    )
  }
  if (body.currentStatus !== undefined) {
    error ??= assign(
      patch,
      'currentStatus',
      parseNullableText(body.currentStatus, 'currentStatus', 100),
    )
  }
  if (body.arrivalDate !== undefined) {
    error ??= assign(patch, 'arrivalDate', parseNullableIsoDate(body.arrivalDate, 'arrivalDate'))
  }
  if (body.departureDate !== undefined) {
    error ??= assign(
      patch,
      'departureDate',
      parseNullableIsoDate(body.departureDate, 'departureDate'),
    )
  }
  if (body.notes !== undefined) {
    error ??= assign(patch, 'notes', parseNullableText(body.notes, 'notes'))
  }
  if (body.visibility !== undefined) {
    error ??= assign(patch, 'visibility', parseEnum(VISIBILITIES, body.visibility, 'visibility'))
  }
  if (error) return c.json({ error }, 400)

  const [updated] = await db
    .update(systemNpcsTable)
    .set(patch)
    .where(and(eq(systemNpcsTable.id, presenceId), eq(systemNpcsTable.systemId, systemId)))
    .returning({ id: systemNpcsTable.id })

  if (!updated) return c.json({ error: 'NPC presence not found' }, 404)
  return c.json(await loadSystemNpcs(systemId, true))
})

relationships.delete('/:id/npcs/:presenceId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }
  const systemId = c.req.param('id')
  const presenceId = c.req.param('presenceId')
  if (!isUuid(systemId) || !isUuid(presenceId)) {
    return c.json({ error: 'NPC presence not found' }, 404)
  }

  const [removed] = await db
    .delete(systemNpcsTable)
    .where(and(eq(systemNpcsTable.id, presenceId), eq(systemNpcsTable.systemId, systemId)))
    .returning({ id: systemNpcsTable.id })

  if (!removed) return c.json({ error: 'NPC presence not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* Ship visits                                                                */
/* -------------------------------------------------------------------------- */

relationships.get('/:id/ships', async (c) => {
  const id = c.req.param('id')
  if (!(await systemExists(id))) return c.json({ error: 'System not found' }, 404)
  return c.json(await loadSystemShips(id, isGameMaster(c.get('viewerRole'))))
})

relationships.post('/:id/ships', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body, viewerId } = ctx

  const shipId = parseUuid(body.shipId, 'shipId')
  if (!shipId.ok) return c.json({ error: shipId.error }, 400)
  if (!(await entityExists(shipsTable, shipId.value))) {
    return c.json({ error: 'Ship not found' }, 404)
  }

  const dockedAtLocationId = parseNullableUuid(body.dockedAtLocationId, 'dockedAtLocationId')
  if (!dockedAtLocationId.ok) return c.json({ error: dockedAtLocationId.error }, 400)

  if (dockedAtLocationId.value) {
    const [location] = await db
      .select({ id: locationsTable.id })
      .from(locationsTable)
      .where(
        and(
          eq(locationsTable.id, dockedAtLocationId.value),
          eq(locationsTable.systemId, systemId),
        ),
      )
      .limit(1)
    if (!location) {
      return c.json({ error: 'That docking location does not belong to this system' }, 400)
    }
  }

  const arrivalDate = parseNullableIsoDate(body.arrivalDate, 'arrivalDate')
  if (!arrivalDate.ok) return c.json({ error: arrivalDate.error }, 400)

  const departureDate = parseNullableIsoDate(body.departureDate, 'departureDate')
  if (!departureDate.ok) return c.json({ error: departureDate.error }, 400)

  if (arrivalDate.value && departureDate.value && departureDate.value < arrivalDate.value) {
    return c.json({ error: 'departureDate cannot be before arrivalDate' }, 400)
  }

  const purpose = parseNullableEnum(SHIP_VISIT_PURPOSES, body.purpose, 'purpose')
  if (!purpose.ok) return c.json({ error: purpose.error }, 400)

  const status =
    body.status === undefined
      ? { ok: true as const, value: 'docked' as const }
      : parseEnum(SHIP_VISIT_STATUSES, body.status, 'status')
  if (!status.ok) return c.json({ error: status.error }, 400)

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return c.json({ error: notes.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'public' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  await db.insert(systemShipsTable).values({
    systemId,
    shipId: shipId.value,
    dockedAtLocationId: dockedAtLocationId.value,
    arrivalDate: arrivalDate.value,
    departureDate: departureDate.value,
    purpose: purpose.value,
    status: status.value,
    notes: notes.value,
    visibility: visibility.value,
    createdBy: viewerId,
  })

  return c.json(await loadSystemShips(systemId, true), 201)
})

relationships.put('/:id/ships/:presenceId', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body } = ctx

  const presenceId = c.req.param('presenceId')
  if (!isUuid(presenceId)) return c.json({ error: 'Ship visit not found' }, 404)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  let error: string | null = null

  if (body.dockedAtLocationId !== undefined) {
    const location = parseNullableUuid(body.dockedAtLocationId, 'dockedAtLocationId')
    if (!location.ok) return c.json({ error: location.error }, 400)
    if (location.value) {
      const [row] = await db
        .select({ id: locationsTable.id })
        .from(locationsTable)
        .where(
          and(eq(locationsTable.id, location.value), eq(locationsTable.systemId, systemId)),
        )
        .limit(1)
      if (!row) {
        return c.json({ error: 'That docking location does not belong to this system' }, 400)
      }
    }
    patch.dockedAtLocationId = location.value
  }
  if (body.arrivalDate !== undefined) {
    error ??= assign(patch, 'arrivalDate', parseNullableIsoDate(body.arrivalDate, 'arrivalDate'))
  }
  if (body.departureDate !== undefined) {
    error ??= assign(
      patch,
      'departureDate',
      parseNullableIsoDate(body.departureDate, 'departureDate'),
    )
  }
  if (body.purpose !== undefined) {
    error ??= assign(patch, 'purpose', parseNullableEnum(SHIP_VISIT_PURPOSES, body.purpose, 'purpose'))
  }
  if (body.status !== undefined) {
    error ??= assign(patch, 'status', parseEnum(SHIP_VISIT_STATUSES, body.status, 'status'))
  }
  if (body.notes !== undefined) {
    error ??= assign(patch, 'notes', parseNullableText(body.notes, 'notes'))
  }
  if (body.visibility !== undefined) {
    error ??= assign(patch, 'visibility', parseEnum(VISIBILITIES, body.visibility, 'visibility'))
  }
  if (error) return c.json({ error }, 400)

  const [updated] = await db
    .update(systemShipsTable)
    .set(patch)
    .where(and(eq(systemShipsTable.id, presenceId), eq(systemShipsTable.systemId, systemId)))
    .returning({ id: systemShipsTable.id })

  if (!updated) return c.json({ error: 'Ship visit not found' }, 404)
  return c.json(await loadSystemShips(systemId, true))
})

relationships.delete('/:id/ships/:presenceId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }
  const systemId = c.req.param('id')
  const presenceId = c.req.param('presenceId')
  if (!isUuid(systemId) || !isUuid(presenceId)) {
    return c.json({ error: 'Ship visit not found' }, 404)
  }

  const [removed] = await db
    .delete(systemShipsTable)
    .where(and(eq(systemShipsTable.id, presenceId), eq(systemShipsTable.systemId, systemId)))
    .returning({ id: systemShipsTable.id })

  if (!removed) return c.json({ error: 'Ship visit not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* Patron offers                                                              */
/* -------------------------------------------------------------------------- */

relationships.get('/:id/patrons', async (c) => {
  const id = c.req.param('id')
  if (!(await systemExists(id))) return c.json({ error: 'System not found' }, 404)
  return c.json(await loadSystemPatrons(id, isGameMaster(c.get('viewerRole'))))
})

relationships.post('/:id/patrons', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body, viewerId } = ctx

  const patronId = parseUuid(body.patronId, 'patronId')
  if (!patronId.ok) return c.json({ error: patronId.error }, 400)
  if (!(await entityExists(patronsTable, patronId.value))) {
    return c.json({ error: 'Patron not found' }, 404)
  }

  const availability =
    body.availability === undefined
      ? { ok: true as const, value: 'available' as const }
      : parseEnum(PATRON_AVAILABILITIES, body.availability, 'availability')
  if (!availability.ok) return c.json({ error: availability.error }, 400)

  const jobSummary = parseNullableText(body.jobSummary, 'jobSummary')
  if (!jobSummary.ok) return c.json({ error: jobSummary.error }, 400)

  const reward = parseNullableText(body.reward, 'reward', 200)
  if (!reward.ok) return c.json({ error: reward.error }, 400)

  const difficulty = parseNullableEnum(JOB_DIFFICULTIES, body.difficulty, 'difficulty')
  if (!difficulty.ok) return c.json({ error: difficulty.error }, 400)

  const legalStatus = parseNullableEnum(LEGAL_STATUSES, body.legalStatus, 'legalStatus')
  if (!legalStatus.ok) return c.json({ error: legalStatus.error }, 400)

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return c.json({ error: notes.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'public' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  await db.insert(systemPatronsTable).values({
    systemId,
    patronId: patronId.value,
    availability: availability.value,
    jobSummary: jobSummary.value,
    reward: reward.value,
    difficulty: difficulty.value,
    legalStatus: legalStatus.value,
    notes: notes.value,
    visibility: visibility.value,
    createdBy: viewerId,
  })

  return c.json(await loadSystemPatrons(systemId, true), 201)
})

relationships.put('/:id/patrons/:presenceId', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body } = ctx

  const presenceId = c.req.param('presenceId')
  if (!isUuid(presenceId)) return c.json({ error: 'Patron offer not found' }, 404)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  let error: string | null = null

  if (body.availability !== undefined) {
    error ??= assign(
      patch,
      'availability',
      parseEnum(PATRON_AVAILABILITIES, body.availability, 'availability'),
    )
  }
  if (body.jobSummary !== undefined) {
    error ??= assign(patch, 'jobSummary', parseNullableText(body.jobSummary, 'jobSummary'))
  }
  if (body.reward !== undefined) {
    error ??= assign(patch, 'reward', parseNullableText(body.reward, 'reward', 200))
  }
  if (body.difficulty !== undefined) {
    error ??= assign(
      patch,
      'difficulty',
      parseNullableEnum(JOB_DIFFICULTIES, body.difficulty, 'difficulty'),
    )
  }
  if (body.legalStatus !== undefined) {
    error ??= assign(
      patch,
      'legalStatus',
      parseNullableEnum(LEGAL_STATUSES, body.legalStatus, 'legalStatus'),
    )
  }
  if (body.notes !== undefined) {
    error ??= assign(patch, 'notes', parseNullableText(body.notes, 'notes'))
  }
  if (body.visibility !== undefined) {
    error ??= assign(patch, 'visibility', parseEnum(VISIBILITIES, body.visibility, 'visibility'))
  }
  if (error) return c.json({ error }, 400)

  const [updated] = await db
    .update(systemPatronsTable)
    .set(patch)
    .where(and(eq(systemPatronsTable.id, presenceId), eq(systemPatronsTable.systemId, systemId)))
    .returning({ id: systemPatronsTable.id })

  if (!updated) return c.json({ error: 'Patron offer not found' }, 404)
  return c.json(await loadSystemPatrons(systemId, true))
})

relationships.delete('/:id/patrons/:presenceId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }
  const systemId = c.req.param('id')
  const presenceId = c.req.param('presenceId')
  if (!isUuid(systemId) || !isUuid(presenceId)) {
    return c.json({ error: 'Patron offer not found' }, 404)
  }

  const [removed] = await db
    .delete(systemPatronsTable)
    .where(and(eq(systemPatronsTable.id, presenceId), eq(systemPatronsTable.systemId, systemId)))
    .returning({ id: systemPatronsTable.id })

  if (!removed) return c.json({ error: 'Patron offer not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* In-system locations (owned by the system, not a junction)                  */
/* -------------------------------------------------------------------------- */

relationships.get('/:id/locations', async (c) => {
  const id = c.req.param('id')
  if (!(await systemExists(id))) return c.json({ error: 'System not found' }, 404)
  return c.json(await loadSystemLocations(id, isGameMaster(c.get('viewerRole'))))
})

relationships.post('/:id/locations', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body, viewerId } = ctx

  const name = parseText(body.name, 'name', 150)
  if (!name.ok) return c.json({ error: name.error }, 400)

  const type =
    body.type === undefined
      ? { ok: true as const, value: 'other' as const }
      : parseEnum(LOCATION_TYPES, body.type, 'type')
  if (!type.ok) return c.json({ error: type.error }, 400)

  const description = parseNullableText(body.description, 'description')
  if (!description.ok) return c.json({ error: description.error }, 400)

  const securityLevel = parseNullableIntInRange(body.securityLevel, 'securityLevel', 0, 9)
  if (!securityLevel.ok) return c.json({ error: securityLevel.error }, 400)

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return c.json({ error: notes.error }, 400)

  const traitIds = parseUuidList(body.traitIds, 'traitIds')
  if (!traitIds.ok) return c.json({ error: traitIds.error }, 400)
  const traitError = await assertTraitsExist(traitIds.value)
  if (traitError) return c.json({ error: traitError }, 400)

  const [clash] = await db
    .select({ id: locationsTable.id })
    .from(locationsTable)
    .where(and(eq(locationsTable.systemId, systemId), eq(locationsTable.name, name.value)))
    .limit(1)
  if (clash) {
    return c.json({ error: 'This system already has a location with that name' }, 409)
  }

  const [created] = await db
    .insert(locationsTable)
    .values({
      systemId,
      name: name.value,
      type: type.value,
      description: description.value,
      securityLevel: securityLevel.value,
      notes: notes.value,
      createdBy: viewerId,
    })
    .returning({ id: locationsTable.id })

  await replaceTraitLinks(
    locationTraitsTable,
    locationTraitsTable.locationId,
    'locationId',
    'traitId',
    created.id,
    traitIds.value,
  )

  return c.json(await loadSystemLocations(systemId, true), 201)
})

relationships.put('/:id/locations/:locationId', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body } = ctx

  const locationId = c.req.param('locationId')
  if (!isUuid(locationId)) return c.json({ error: 'Location not found' }, 404)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  let error: string | null = null

  if (body.name !== undefined) {
    error ??= assign(patch, 'name', parseText(body.name, 'name', 150))
  }
  if (body.type !== undefined) {
    error ??= assign(patch, 'type', parseEnum(LOCATION_TYPES, body.type, 'type'))
  }
  if (body.description !== undefined) {
    error ??= assign(patch, 'description', parseNullableText(body.description, 'description'))
  }
  if (body.securityLevel !== undefined) {
    error ??= assign(
      patch,
      'securityLevel',
      parseNullableIntInRange(body.securityLevel, 'securityLevel', 0, 9),
    )
  }
  if (body.notes !== undefined) {
    error ??= assign(patch, 'notes', parseNullableText(body.notes, 'notes'))
  }
  if (error) return c.json({ error }, 400)

  const [updated] = await db
    .update(locationsTable)
    .set(patch)
    .where(and(eq(locationsTable.id, locationId), eq(locationsTable.systemId, systemId)))
    .returning({ id: locationsTable.id })

  if (!updated) return c.json({ error: 'Location not found' }, 404)

  if (body.traitIds !== undefined) {
    const traitIds = parseUuidList(body.traitIds, 'traitIds')
    if (!traitIds.ok) return c.json({ error: traitIds.error }, 400)
    const traitError = await assertTraitsExist(traitIds.value)
    if (traitError) return c.json({ error: traitError }, 400)
    await replaceTraitLinks(
      locationTraitsTable,
      locationTraitsTable.locationId,
      'locationId',
      'traitId',
      locationId,
      traitIds.value,
    )
  }

  return c.json(await loadSystemLocations(systemId, true))
})

relationships.delete('/:id/locations/:locationId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }
  const systemId = c.req.param('id')
  const locationId = c.req.param('locationId')
  if (!isUuid(systemId) || !isUuid(locationId)) {
    return c.json({ error: 'Location not found' }, 404)
  }

  const [removed] = await db
    .delete(locationsTable)
    .where(and(eq(locationsTable.id, locationId), eq(locationsTable.systemId, systemId)))
    .returning({ id: locationsTable.id })

  if (!removed) return c.json({ error: 'Location not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* Inter-system connections                                                   */
/* -------------------------------------------------------------------------- */

relationships.get('/:id/connections', async (c) => {
  const id = c.req.param('id')
  if (!(await systemExists(id))) return c.json({ error: 'System not found' }, 404)
  return c.json(await loadSystemConnections(id, isGameMaster(c.get('viewerRole'))))
})

relationships.post('/:id/connections', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body, viewerId } = ctx

  const toSystemId = parseUuid(body.toSystemId, 'toSystemId')
  if (!toSystemId.ok) return c.json({ error: toSystemId.error }, 400)
  if (toSystemId.value === systemId) {
    return c.json({ error: 'A system cannot be linked to itself' }, 400)
  }
  if (!(await entityExists(systemsTable, toSystemId.value))) {
    return c.json({ error: 'Destination system not found' }, 404)
  }

  const relationshipType = parseEnum(SYSTEM_LINK_TYPES, body.relationshipType, 'relationshipType')
  if (!relationshipType.ok) return c.json({ error: relationshipType.error }, 400)

  const strength =
    body.strength === undefined
      ? { ok: true as const, value: 2 }
      : parseIntInRange(body.strength, 'strength', 1, 5)
  if (!strength.ok) return c.json({ error: strength.error }, 400)

  const active =
    body.active === undefined
      ? { ok: true as const, value: true }
      : parseBoolean(body.active, 'active')
  if (!active.ok) return c.json({ error: active.error }, 400)

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return c.json({ error: notes.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'public' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  const [clash] = await db
    .select({ id: systemLinksTable.id })
    .from(systemLinksTable)
    .where(
      and(
        eq(systemLinksTable.fromSystemId, systemId),
        eq(systemLinksTable.toSystemId, toSystemId.value),
        eq(systemLinksTable.relationshipType, relationshipType.value),
      ),
    )
    .limit(1)
  if (clash) {
    return c.json({ error: 'That connection already exists between these systems' }, 409)
  }

  await db.insert(systemLinksTable).values({
    fromSystemId: systemId,
    toSystemId: toSystemId.value,
    relationshipType: relationshipType.value,
    strength: strength.value,
    active: active.value,
    notes: notes.value,
    visibility: visibility.value,
    createdBy: viewerId,
  })

  return c.json(await loadSystemConnections(systemId, true), 201)
})

relationships.put('/:id/connections/:connId', async (c) => {
  const ctx = await gmWriteContext(c)
  if (!ctx.ok) return c.json({ error: ctx.failure.error }, ctx.failure.status)
  const { systemId, body } = ctx

  const connId = c.req.param('connId')
  if (!isUuid(connId)) return c.json({ error: 'Connection not found' }, 404)

  const patch: Record<string, unknown> = { updatedAt: new Date() }
  let error: string | null = null

  if (body.relationshipType !== undefined) {
    error ??= assign(
      patch,
      'relationshipType',
      parseEnum(SYSTEM_LINK_TYPES, body.relationshipType, 'relationshipType'),
    )
  }
  if (body.strength !== undefined) {
    error ??= assign(patch, 'strength', parseIntInRange(body.strength, 'strength', 1, 5))
  }
  if (body.active !== undefined) {
    error ??= assign(patch, 'active', parseBoolean(body.active, 'active'))
  }
  if (body.notes !== undefined) {
    error ??= assign(patch, 'notes', parseNullableText(body.notes, 'notes'))
  }
  if (body.visibility !== undefined) {
    error ??= assign(patch, 'visibility', parseEnum(VISIBILITIES, body.visibility, 'visibility'))
  }
  if (error) return c.json({ error }, 400)

  // Either end of the link may be edited from its own system page.
  const [updated] = await db
    .update(systemLinksTable)
    .set(patch)
    .where(
      and(
        eq(systemLinksTable.id, connId),
        or(
          eq(systemLinksTable.fromSystemId, systemId),
          eq(systemLinksTable.toSystemId, systemId),
        ),
      ),
    )
    .returning({ id: systemLinksTable.id })

  if (!updated) return c.json({ error: 'Connection not found' }, 404)

  return c.json(await loadSystemConnections(systemId, true))
})

relationships.delete('/:id/connections/:connId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }
  const systemId = c.req.param('id')
  const connId = c.req.param('connId')
  if (!isUuid(systemId) || !isUuid(connId)) {
    return c.json({ error: 'Connection not found' }, 404)
  }

  const [link] = await db
    .select({
      id: systemLinksTable.id,
      fromSystemId: systemLinksTable.fromSystemId,
      toSystemId: systemLinksTable.toSystemId,
    })
    .from(systemLinksTable)
    .where(eq(systemLinksTable.id, connId))
    .limit(1)

  if (!link || (link.fromSystemId !== systemId && link.toSystemId !== systemId)) {
    return c.json({ error: 'Connection not found' }, 404)
  }

  await db.delete(systemLinksTable).where(eq(systemLinksTable.id, connId))
  return c.json({ ok: true, id: connId })
})

export default relationships
