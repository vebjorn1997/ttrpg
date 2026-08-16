import { Hono } from 'hono'
import { and, asc, desc, eq, gte, ilike, isNull, lte, or, type SQL } from 'drizzle-orm'
import { db } from '../db/client'
import {
  systemHooksTable,
  systemInteractionsTable,
  systemTimelineTable,
  systemTraitsTable,
  systemsTable,
} from '../db/schema/systems'
import { tlTable } from '../db/schema/tl'
import { lawlevelTable } from '../db/schema/lawlevel'
import { traitsTable } from '../db/schema/traits'
import { factionsTable } from '../db/schema/factions'
import { user } from '../db/schema/auth'
import {
  attachViewer,
  isGameMaster,
  type ViewerVariables,
} from '../lib/internal-auth'
import { VISIBILITIES } from '../lib/campaign-enums'
import {
  invalid,
  isUuid,
  parseBoolean,
  parseEnum,
  parseHexLocation,
  parseIntInRange,
  parseNullableText,
  parseNullableUuid,
  parseText,
  parseUuidList,
  readJsonBody,
  type Parsed,
} from '../lib/campaign-parse'
import { normalizeTravellerDate } from '../lib/traveller-date'
import {
  assertTraitsExist,
  replaceTraitLinks,
  traitsByParent,
  type TraitRow,
} from '../lib/campaign-traits'
import { loadSystemRelationships } from '../lib/campaign-relationships'
import { iso, toFactionRef, type FactionRef } from '../lib/campaign-view'
import { parseCsv } from '../lib/csv'
import relationships from './systemRelationships'

const systems = new Hono<{ Variables: ViewerVariables }>()

systems.use('*', attachViewer)

const NO_TRAITS: TraitRow[] = []

type SystemRow = typeof systemsTable.$inferSelect

/* -------------------------------------------------------------------------- */
/* Reads                                                                      */
/* -------------------------------------------------------------------------- */

function baseSystemQuery() {
  return db
    .select({
      system: systemsTable,
      techLevelName: tlTable.name,
      lawLevelName: lawlevelTable.name,
      controller: factionsTable,
    })
    .from(systemsTable)
    .leftJoin(tlTable, eq(tlTable.level, systemsTable.techLevel))
    .leftJoin(lawlevelTable, eq(lawlevelTable.lawlevel, systemsTable.lawLevel))
    .leftJoin(factionsTable, eq(factionsTable.id, systemsTable.controllerFactionId))
}

function toSystemSummary(
  row: SystemRow,
  techLevelName: string | null,
  lawLevelName: string | null,
  traits: TraitRow[],
  isGm: boolean,
  controller: FactionRef | null,
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    location: row.location,
    techLevel: row.techLevel,
    techLevelName,
    lawLevel: row.lawLevel,
    lawLevelName,
    controllerFactionId: row.controllerFactionId,
    controller,
    traits,
    ...(isGm ? { notes: row.notes } : {}),
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

function factionRefFromJoin(
  faction: typeof factionsTable.$inferSelect | null,
): FactionRef | null {
  return faction?.id ? toFactionRef(faction) : null
}

async function loadSystemTraits(systemIds: string[]) {
  return traitsByParent(
    systemTraitsTable,
    systemTraitsTable.systemId,
    systemTraitsTable.traitId,
    systemIds,
  )
}

/** GM sees every hook; everyone else sees public hooks that are still unused. */
async function loadHooks(systemId: string, isGm: boolean) {
  const rows = await db
    .select()
    .from(systemHooksTable)
    .where(
      isGm
        ? eq(systemHooksTable.systemId, systemId)
        : and(
            eq(systemHooksTable.systemId, systemId),
            eq(systemHooksTable.visibility, 'public'),
            eq(systemHooksTable.used, false),
          ),
    )
    .orderBy(asc(systemHooksTable.createdAt))

  return rows.map((row) => ({
    id: row.id,
    systemId: row.systemId,
    title: row.title,
    description: row.description,
    used: row.used,
    visibility: row.visibility,
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }))
}

/** Traveller log, newest first. Visible to everyone who can see the system. */
async function loadInteractions(systemId: string) {
  const rows = await db
    .select({ entry: systemInteractionsTable, authorName: user.name })
    .from(systemInteractionsTable)
    .leftJoin(user, eq(user.id, systemInteractionsTable.recordedBy))
    .where(eq(systemInteractionsTable.systemId, systemId))
    .orderBy(desc(systemInteractionsTable.entryDate), desc(systemInteractionsTable.createdAt))

  return rows.map(({ entry, authorName }) => ({
    id: entry.id,
    systemId: entry.systemId,
    date: entry.entryDate,
    dateDisplay: entry.entryDateRaw ?? entry.entryDate,
    event: entry.event,
    recordedBy: entry.recordedBy,
    recordedByName: authorName,
    createdAt: iso(entry.createdAt),
    updatedAt: iso(entry.updatedAt),
  }))
}

async function loadTimeline(systemId: string, isGm: boolean) {
  const rows = await db
    .select({ entry: systemTimelineTable, authorName: user.name })
    .from(systemTimelineTable)
    .leftJoin(user, eq(user.id, systemTimelineTable.createdBy))
    .where(
      isGm
        ? eq(systemTimelineTable.systemId, systemId)
        : and(
            eq(systemTimelineTable.systemId, systemId),
            eq(systemTimelineTable.visibility, 'public'),
          ),
    )
    .orderBy(desc(systemTimelineTable.entryDate), desc(systemTimelineTable.createdAt))

  return rows.map(({ entry, authorName }) => ({
    id: entry.id,
    systemId: entry.systemId,
    date: entry.entryDate,
    dateDisplay: entry.entryDateRaw ?? entry.entryDate,
    event: entry.event,
    visibility: entry.visibility,
    createdBy: entry.createdBy,
    createdByName: authorName,
    createdAt: iso(entry.createdAt),
    updatedAt: iso(entry.updatedAt),
  }))
}

async function loadSystemDetail(systemId: string, isGm: boolean) {
  const [row] = await baseSystemQuery().where(eq(systemsTable.id, systemId)).limit(1)
  if (!row) return null

  const [traitMap, hooks, interactions, timeline, relations] = await Promise.all([
    loadSystemTraits([systemId]),
    loadHooks(systemId, isGm),
    loadInteractions(systemId),
    loadTimeline(systemId, isGm),
    loadSystemRelationships(systemId, isGm),
  ])

  return {
    ...toSystemSummary(
      row.system,
      row.techLevelName,
      row.lawLevelName,
      traitMap.get(systemId) ?? NO_TRAITS,
      isGm,
      factionRefFromJoin(row.controller),
    ),
    hooks,
    interactions,
    timeline,
    relationships: relations,
  }
}

function intParam(value: string | undefined): number | null {
  if (value === undefined || value.trim() === '') return null
  const n = Number(value)
  return Number.isInteger(n) ? n : null
}

/**
 * Travel zone is expressed as a `System` trait rather than a column. Callers
 * may ask for either the short zone name or the full trait name, since the UI
 * builds its options straight from the trait glossary.
 */
const TRAVEL_ZONE_TRAITS: Record<string, string> = {
  red: 'red zone',
  'red zone': 'red zone',
  amber: 'amber zone',
  'amber zone': 'amber zone',
}

const HAZARD_ZONE_NAMES = ['red zone', 'amber zone']

systems.get('/', async (c) => {
  const isGm = isGameMaster(c.get('viewerRole'))
  const query = c.req.query()

  const filters: (SQL | undefined)[] = []

  const search = query.search?.trim()
  if (search) {
    const like = `%${search}%`
    filters.push(
      or(ilike(systemsTable.name, like), ilike(systemsTable.description, like)),
    )
  }

  const tlMin = intParam(query.tl_min)
  const tlMax = intParam(query.tl_max)
  const lawMin = intParam(query.law_min)
  const lawMax = intParam(query.law_max)
  if (tlMin !== null) filters.push(gte(systemsTable.techLevel, tlMin))
  if (tlMax !== null) filters.push(lte(systemsTable.techLevel, tlMax))
  if (lawMin !== null) filters.push(gte(systemsTable.lawLevel, lawMin))
  if (lawMax !== null) filters.push(lte(systemsTable.lawLevel, lawMax))

  const location = query.location?.trim().toUpperCase()
  if (location) filters.push(eq(systemsTable.location, location))

  const controller = query.controller?.trim()
  if (controller) {
    if (controller.toLowerCase() === 'unclaimed' || controller.toLowerCase() === 'none') {
      filters.push(isNull(systemsTable.controllerFactionId))
    } else if (isUuid(controller)) {
      filters.push(eq(systemsTable.controllerFactionId, controller))
    } else {
      filters.push(ilike(factionsTable.name, controller))
    }
  }

  const applied = filters.filter((filter): filter is SQL => filter !== undefined)
  const rows = await (applied.length
    ? baseSystemQuery().where(and(...applied))
    : baseSystemQuery()
  ).orderBy(asc(systemsTable.name))

  const traitMap = await loadSystemTraits(rows.map((row) => row.system.id))

  let summaries = rows.map((row) =>
    toSystemSummary(
      row.system,
      row.techLevelName,
      row.lawLevelName,
      traitMap.get(row.system.id) ?? NO_TRAITS,
      isGm,
      factionRefFromJoin(row.controller),
    ),
  )

  // Trait filters run in memory: the tag set per system is small, and this keeps
  // "must have all of these traits" readable versus a repeated-join query.
  const wanted = c.req
    .queries('trait')
    ?.flatMap((value) => value.split(','))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)

  if (wanted?.length) {
    summaries = summaries.filter((system) => {
      const owned = new Set(
        system.traits.flatMap((trait) => [trait.name.toLowerCase(), trait.id]),
      )
      return wanted.every((value) => owned.has(value))
    })
  }

  const travelZone = query.travel_zone?.trim().toLowerCase()
  if (travelZone) {
    const zoneTrait = TRAVEL_ZONE_TRAITS[travelZone]
    if (zoneTrait) {
      summaries = summaries.filter((system) =>
        system.traits.some((trait) => trait.name.toLowerCase() === zoneTrait),
      )
    } else if (travelZone === 'green') {
      // Green is the absence of a hazard marker rather than a trait of its own.
      summaries = summaries.filter(
        (system) =>
          !system.traits.some((trait) =>
            HAZARD_ZONE_NAMES.includes(trait.name.toLowerCase()),
          ),
      )
    } else {
      return c.json({ error: 'Unknown travel zone' }, 400)
    }
  }

  return c.json(summaries)
})

/** Whole-database backup. Respects the caller's visibility tier. */
systems.get('/export', async (c) => {
  const role = c.get('viewerRole')
  const isGm = isGameMaster(role)

  const rows = await baseSystemQuery().orderBy(asc(systemsTable.name))
  const details = await Promise.all(
    rows.map((row) => loadSystemDetail(row.system.id, isGm)),
  )

  return c.json({
    exportedAt: new Date().toISOString(),
    viewerRole: role,
    systemCount: details.length,
    systems: details.filter(Boolean),
  })
})

systems.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'System not found' }, 404)

  const detail = await loadSystemDetail(id, isGameMaster(c.get('viewerRole')))
  if (!detail) return c.json({ error: 'System not found' }, 404)

  return c.json(detail)
})

systems.get('/:id/export', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'System not found' }, 404)

  const role = c.get('viewerRole')
  const detail = await loadSystemDetail(id, isGameMaster(role))
  if (!detail) return c.json({ error: 'System not found' }, 404)

  return c.json({
    exportedAt: new Date().toISOString(),
    viewerRole: role,
    system: detail,
  })
})

systems.get('/:id/relationships', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'System not found' }, 404)

  const isGm = isGameMaster(c.get('viewerRole'))
  const [exists] = await db
    .select({ id: systemsTable.id })
    .from(systemsTable)
    .where(eq(systemsTable.id, id))
    .limit(1)
  if (!exists) return c.json({ error: 'System not found' }, 404)

  return c.json(await loadSystemRelationships(id, isGm))
})

/* -------------------------------------------------------------------------- */
/* Writes                                                                     */
/* -------------------------------------------------------------------------- */

type SystemFields = {
  name: string
  description: string | null
  techLevel: number
  lawLevel: number
  location: string
  controllerFactionId: string | null
  notes: string | null
  traitIds: string[]
}

async function parseSystemBody(body: Record<string, unknown>): Promise<Parsed<SystemFields>> {
  const name = parseText(body.name, 'name', 100)
  if (!name.ok) return name

  const description = parseNullableText(body.description, 'description')
  if (!description.ok) return description

  const techLevel = parseIntInRange(body.techLevel ?? body.tech_level, 'techLevel', 0, 9)
  if (!techLevel.ok) return techLevel

  const lawLevel = parseIntInRange(body.lawLevel ?? body.law_level, 'lawLevel', 0, 4)
  if (!lawLevel.ok) return lawLevel

  const location = parseHexLocation(body.location)
  if (!location.ok) return location

  const controllerFactionId = parseNullableUuid(
    body.controllerFactionId ?? body.controller,
    'controllerFactionId',
  )
  if (!controllerFactionId.ok) return controllerFactionId

  if (controllerFactionId.value) {
    const [faction] = await db
      .select({ id: factionsTable.id })
      .from(factionsTable)
      .where(eq(factionsTable.id, controllerFactionId.value))
      .limit(1)
    if (!faction) return invalid('controllerFactionId is not a known faction')
  }

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return notes

  const traitIds = parseUuidList(body.traitIds, 'traitIds')
  if (!traitIds.ok) return traitIds

  const traitError = await assertTraitsExist(traitIds.value)
  if (traitError) return invalid(traitError)

  const [tl] = await db
    .select({ level: tlTable.level })
    .from(tlTable)
    .where(eq(tlTable.level, techLevel.value))
    .limit(1)
  if (!tl) return invalid(`techLevel ${techLevel.value} is not a known tech level`)

  const [law] = await db
    .select({ level: lawlevelTable.lawlevel })
    .from(lawlevelTable)
    .where(eq(lawlevelTable.lawlevel, lawLevel.value))
    .limit(1)
  if (!law) return invalid(`lawLevel ${lawLevel.value} is not a known law level`)

  return {
    ok: true,
    value: {
      name: name.value,
      description: description.value,
      techLevel: techLevel.value,
      lawLevel: lawLevel.value,
      location: location.value,
      controllerFactionId: controllerFactionId.value,
      notes: notes.value,
      traitIds: traitIds.value,
    },
  }
}

systems.post('/', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseSystemBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [existing] = await db
    .select({ id: systemsTable.id })
    .from(systemsTable)
    .where(
      or(
        eq(systemsTable.name, fields.value.name),
        eq(systemsTable.location, fields.value.location),
      ),
    )
    .limit(1)
  if (existing) {
    return c.json({ error: 'A system with that name or hex location already exists' }, 409)
  }

  const [created] = await db
    .insert(systemsTable)
    .values({
      name: fields.value.name,
      description: fields.value.description,
      techLevel: fields.value.techLevel,
      lawLevel: fields.value.lawLevel,
      location: fields.value.location,
      controllerFactionId: fields.value.controllerFactionId,
      notes: fields.value.notes,
      createdBy: c.get('viewerId'),
    })
    .returning()

  await replaceTraitLinks(
    systemTraitsTable,
    systemTraitsTable.systemId,
    'systemId',
    'traitId',
    created.id,
    fields.value.traitIds,
  )

  return c.json(await loadSystemDetail(created.id, true), 201)
})

systems.put('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'System not found' }, 404)

  const [current] = await db
    .select({ id: systemsTable.id })
    .from(systemsTable)
    .where(eq(systemsTable.id, id))
    .limit(1)
  if (!current) return c.json({ error: 'System not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parseSystemBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const clashes = await db
    .select({ id: systemsTable.id })
    .from(systemsTable)
    .where(
      or(
        eq(systemsTable.name, fields.value.name),
        eq(systemsTable.location, fields.value.location),
      ),
    )
  if (clashes.some((row) => row.id !== id)) {
    return c.json({ error: 'A system with that name or hex location already exists' }, 409)
  }

  await db
    .update(systemsTable)
    .set({
      name: fields.value.name,
      description: fields.value.description,
      techLevel: fields.value.techLevel,
      lawLevel: fields.value.lawLevel,
      location: fields.value.location,
      controllerFactionId: fields.value.controllerFactionId,
      notes: fields.value.notes,
      updatedAt: new Date(),
    })
    .where(eq(systemsTable.id, id))

  await replaceTraitLinks(
    systemTraitsTable,
    systemTraitsTable.systemId,
    'systemId',
    'traitId',
    id,
    fields.value.traitIds,
  )

  return c.json(await loadSystemDetail(id, true))
})

systems.delete('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'System not found' }, 404)

  const [removed] = await db
    .delete(systemsTable)
    .where(eq(systemsTable.id, id))
    .returning({ id: systemsTable.id })

  if (!removed) return c.json({ error: 'System not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* Adventure hooks                                                            */
/* -------------------------------------------------------------------------- */

async function systemExists(id: string): Promise<boolean> {
  const [row] = await db
    .select({ id: systemsTable.id })
    .from(systemsTable)
    .where(eq(systemsTable.id, id))
    .limit(1)
  return Boolean(row)
}

systems.get('/:id/hooks', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id) || !(await systemExists(id))) {
    return c.json({ error: 'System not found' }, 404)
  }
  return c.json(await loadHooks(id, isGameMaster(c.get('viewerRole'))))
})

systems.post('/:id/hooks', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id) || !(await systemExists(id))) {
    return c.json({ error: 'System not found' }, 404)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const title = parseText(body.title, 'title', 200)
  if (!title.ok) return c.json({ error: title.error }, 400)

  const description = parseNullableText(body.description, 'description')
  if (!description.ok) return c.json({ error: description.error }, 400)

  const used = body.used === undefined ? { ok: true as const, value: false } : parseBoolean(body.used, 'used')
  if (!used.ok) return c.json({ error: used.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'public' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  await db.insert(systemHooksTable).values({
    systemId: id,
    title: title.value,
    description: description.value,
    used: used.value,
    visibility: visibility.value,
    createdBy: c.get('viewerId'),
  })

  return c.json(await loadHooks(id, true), 201)
})

systems.put('/:id/hooks/:hookId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  const hookId = c.req.param('hookId')
  if (!isUuid(id) || !isUuid(hookId)) return c.json({ error: 'Hook not found' }, 404)

  const [hook] = await db
    .select()
    .from(systemHooksTable)
    .where(and(eq(systemHooksTable.id, hookId), eq(systemHooksTable.systemId, id)))
    .limit(1)
  if (!hook) return c.json({ error: 'Hook not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const patch: Partial<typeof systemHooksTable.$inferInsert> = { updatedAt: new Date() }

  if (body.title !== undefined) {
    const title = parseText(body.title, 'title', 200)
    if (!title.ok) return c.json({ error: title.error }, 400)
    patch.title = title.value
  }
  if (body.description !== undefined) {
    const description = parseNullableText(body.description, 'description')
    if (!description.ok) return c.json({ error: description.error }, 400)
    patch.description = description.value
  }
  if (body.used !== undefined) {
    const used = parseBoolean(body.used, 'used')
    if (!used.ok) return c.json({ error: used.error }, 400)
    patch.used = used.value
  }
  if (body.visibility !== undefined) {
    const visibility = parseEnum(VISIBILITIES, body.visibility, 'visibility')
    if (!visibility.ok) return c.json({ error: visibility.error }, 400)
    patch.visibility = visibility.value
  }

  await db.update(systemHooksTable).set(patch).where(eq(systemHooksTable.id, hookId))

  return c.json(await loadHooks(id, true))
})

systems.delete('/:id/hooks/:hookId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  const hookId = c.req.param('hookId')
  if (!isUuid(id) || !isUuid(hookId)) return c.json({ error: 'Hook not found' }, 404)

  const [removed] = await db
    .delete(systemHooksTable)
    .where(and(eq(systemHooksTable.id, hookId), eq(systemHooksTable.systemId, id)))
    .returning({ id: systemHooksTable.id })

  if (!removed) return c.json({ error: 'Hook not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* Traveller log                                                              */
/* -------------------------------------------------------------------------- */

systems.get('/:id/interactions', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id) || !(await systemExists(id))) {
    return c.json({ error: 'System not found' }, 404)
  }
  return c.json(await loadInteractions(id))
})

systems.post('/:id/interactions', async (c) => {
  const viewerId = c.get('viewerId')
  if (!viewerId) return c.json({ error: 'You must be signed in' }, 401)

  const id = c.req.param('id')
  if (!isUuid(id) || !(await systemExists(id))) {
    return c.json({ error: 'System not found' }, 404)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const raw = typeof body.date === 'string' ? body.date.trim() : ''
  const entryDate = normalizeTravellerDate(body.date)
  if (!entryDate) {
    return c.json(
      { error: 'date must be a Traveller date, e.g. 1105-02-20 or 1105-045' },
      400,
    )
  }

  const event = parseText(body.event, 'event', 4000)
  if (!event.ok) return c.json({ error: event.error }, 400)

  await db.insert(systemInteractionsTable).values({
    systemId: id,
    entryDate,
    entryDateRaw: raw === entryDate ? null : raw,
    event: event.value,
    recordedBy: viewerId,
  })

  return c.json(await loadInteractions(id), 201)
})

systems.put('/:id/interactions/:entryId', async (c) => {
  const viewerId = c.get('viewerId')
  if (!viewerId) return c.json({ error: 'You must be signed in' }, 401)

  const id = c.req.param('id')
  const entryId = c.req.param('entryId')
  if (!isUuid(id) || !isUuid(entryId)) return c.json({ error: 'Log entry not found' }, 404)

  const [entry] = await db
    .select()
    .from(systemInteractionsTable)
    .where(
      and(
        eq(systemInteractionsTable.id, entryId),
        eq(systemInteractionsTable.systemId, id),
      ),
    )
    .limit(1)
  if (!entry) return c.json({ error: 'Log entry not found' }, 404)

  // Players own their entries; the GM may correct anyone's.
  if (!isGameMaster(c.get('viewerRole')) && entry.recordedBy !== viewerId) {
    return c.json({ error: 'You can only edit your own log entries' }, 403)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const patch: Partial<typeof systemInteractionsTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.date !== undefined) {
    const raw = typeof body.date === 'string' ? body.date.trim() : ''
    const entryDate = normalizeTravellerDate(body.date)
    if (!entryDate) {
      return c.json(
        { error: 'date must be a Traveller date, e.g. 1105-02-20 or 1105-045' },
        400,
      )
    }
    patch.entryDate = entryDate
    patch.entryDateRaw = raw === entryDate ? null : raw
  }

  if (body.event !== undefined) {
    const event = parseText(body.event, 'event', 4000)
    if (!event.ok) return c.json({ error: event.error }, 400)
    patch.event = event.value
  }

  await db
    .update(systemInteractionsTable)
    .set(patch)
    .where(eq(systemInteractionsTable.id, entryId))

  return c.json(await loadInteractions(id))
})

systems.delete('/:id/interactions/:entryId', async (c) => {
  const viewerId = c.get('viewerId')
  if (!viewerId) return c.json({ error: 'You must be signed in' }, 401)

  const id = c.req.param('id')
  const entryId = c.req.param('entryId')
  if (!isUuid(id) || !isUuid(entryId)) return c.json({ error: 'Log entry not found' }, 404)

  const [entry] = await db
    .select()
    .from(systemInteractionsTable)
    .where(
      and(
        eq(systemInteractionsTable.id, entryId),
        eq(systemInteractionsTable.systemId, id),
      ),
    )
    .limit(1)
  if (!entry) return c.json({ error: 'Log entry not found' }, 404)

  if (!isGameMaster(c.get('viewerRole')) && entry.recordedBy !== viewerId) {
    return c.json({ error: 'You can only delete your own log entries' }, 403)
  }

  await db.delete(systemInteractionsTable).where(eq(systemInteractionsTable.id, entryId))

  return c.json({ ok: true, id: entryId })
})

/* -------------------------------------------------------------------------- */
/* Timeline history                                                           */
/* -------------------------------------------------------------------------- */

systems.get('/:id/timeline', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id) || !(await systemExists(id))) {
    return c.json({ error: 'System not found' }, 404)
  }
  return c.json(await loadTimeline(id, isGameMaster(c.get('viewerRole'))))
})

systems.post('/:id/timeline', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id) || !(await systemExists(id))) {
    return c.json({ error: 'System not found' }, 404)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const raw = typeof body.date === 'string' ? body.date.trim() : ''
  const entryDate = normalizeTravellerDate(body.date)
  if (!entryDate) {
    return c.json(
      { error: 'date must be a Traveller date, e.g. 1098-01-01 or 1098-001' },
      400,
    )
  }

  const event = parseText(body.event, 'event', 4000)
  if (!event.ok) return c.json({ error: event.error }, 400)

  const visibility =
    body.visibility === undefined
      ? { ok: true as const, value: 'gm_only' as const }
      : parseEnum(VISIBILITIES, body.visibility, 'visibility')
  if (!visibility.ok) return c.json({ error: visibility.error }, 400)

  await db.insert(systemTimelineTable).values({
    systemId: id,
    entryDate,
    entryDateRaw: raw === entryDate ? null : raw,
    event: event.value,
    visibility: visibility.value,
    createdBy: c.get('viewerId'),
  })

  return c.json(await loadTimeline(id, true), 201)
})

systems.put('/:id/timeline/:eventId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  const eventId = c.req.param('eventId')
  if (!isUuid(id) || !isUuid(eventId)) {
    return c.json({ error: 'History event not found' }, 404)
  }

  const [entry] = await db
    .select({ id: systemTimelineTable.id })
    .from(systemTimelineTable)
    .where(and(eq(systemTimelineTable.id, eventId), eq(systemTimelineTable.systemId, id)))
    .limit(1)
  if (!entry) return c.json({ error: 'History event not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const patch: Partial<typeof systemTimelineTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (body.date !== undefined) {
    const raw = typeof body.date === 'string' ? body.date.trim() : ''
    const entryDate = normalizeTravellerDate(body.date)
    if (!entryDate) {
      return c.json({ error: 'date must be a Traveller date' }, 400)
    }
    patch.entryDate = entryDate
    patch.entryDateRaw = raw === entryDate ? null : raw
  }
  if (body.event !== undefined) {
    const event = parseText(body.event, 'event', 4000)
    if (!event.ok) return c.json({ error: event.error }, 400)
    patch.event = event.value
  }
  if (body.visibility !== undefined) {
    const visibility = parseEnum(VISIBILITIES, body.visibility, 'visibility')
    if (!visibility.ok) return c.json({ error: visibility.error }, 400)
    patch.visibility = visibility.value
  }

  await db.update(systemTimelineTable).set(patch).where(eq(systemTimelineTable.id, eventId))

  return c.json(await loadTimeline(id, true))
})

systems.delete('/:id/timeline/:eventId', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  const eventId = c.req.param('eventId')
  if (!isUuid(id) || !isUuid(eventId)) {
    return c.json({ error: 'History event not found' }, 404)
  }

  const [removed] = await db
    .delete(systemTimelineTable)
    .where(and(eq(systemTimelineTable.id, eventId), eq(systemTimelineTable.systemId, id)))
    .returning({ id: systemTimelineTable.id })

  if (!removed) return c.json({ error: 'History event not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

/* -------------------------------------------------------------------------- */
/* CSV import                                                                 */
/* -------------------------------------------------------------------------- */

type ImportedHook = { title?: unknown; description?: unknown; used?: unknown }
type ImportedEntry = { date?: unknown; event?: unknown; visibility?: unknown }

function parseJsonCell<T>(cell: string, label: string, rowNumber: number): T[] | string {
  const trimmed = cell.trim()
  if (trimmed === '') return []
  try {
    const value: unknown = JSON.parse(trimmed)
    if (!Array.isArray(value)) return `Row ${rowNumber}: ${label} must be a JSON array`
    return value as T[]
  } catch {
    return `Row ${rowNumber}: ${label} is not valid JSON`
  }
}

/**
 * Bulk-seed systems from the CSV shape documented in
 * `src/db/seeds/systems_database_seed.csv`. Existing systems are matched by hex
 * location and skipped, so a re-run is safe. Optional `controller` is a faction
 * name or id.
 */
systems.post('/import', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const contentType = c.req.header('content-type') ?? ''
  let csvText: string

  if (contentType.includes('application/json')) {
    const body = await readJsonBody(c.req)
    if (!body || typeof body.csv !== 'string') {
      return c.json({ error: 'Send { "csv": "..." } or a text/csv body' }, 400)
    }
    csvText = body.csv
  } else {
    csvText = await c.req.text()
  }

  if (csvText.trim() === '') return c.json({ error: 'CSV body is empty' }, 400)

  const rows = parseCsv(csvText)
  if (rows.length === 0) return c.json({ error: 'CSV contained no data rows' }, 400)

  const traitRows = await db.select().from(traitsTable)
  const traitIdByName = new Map(
    traitRows.map((trait) => [trait.name.trim().toLowerCase(), trait.id]),
  )
  const factionRows = await db.select({ id: factionsTable.id, name: factionsTable.name }).from(factionsTable)
  const factionIdByName = new Map(
    factionRows.map((faction) => [faction.name.trim().toLowerCase(), faction.id]),
  )

  const created: string[] = []
  const skipped: string[] = []
  const errors: string[] = []
  const viewerId = c.get('viewerId')

  for (const [index, row] of rows.entries()) {
    const rowNumber = index + 2

    const controllerCell = (row.controller ?? row.controller_faction ?? '').trim()
    let controllerFactionId: string | null = null
    if (controllerCell) {
      const controllerKey = controllerCell.toLowerCase()
      if (isUuid(controllerCell)) {
        controllerFactionId = controllerCell
      } else {
        const resolved = factionIdByName.get(controllerKey)
        if (!resolved) {
          errors.push(`Row ${rowNumber}: unknown controller faction "${controllerCell}"`)
          continue
        }
        controllerFactionId = resolved
      }
    }

    const fields = await parseSystemBody({
      name: row.name,
      description: row.description,
      techLevel: row.tech_level,
      lawLevel: row.law_level,
      location: row.location,
      controllerFactionId,
      notes: row.notes,
      traitIds: (row.traits ?? '')
        .split(';')
        .map((name) => traitIdByName.get(name.trim().toLowerCase()))
        .filter((id): id is string => Boolean(id)),
    })

    if (!fields.ok) {
      errors.push(`Row ${rowNumber}: ${fields.error}`)
      continue
    }

    const [clash] = await db
      .select({ id: systemsTable.id })
      .from(systemsTable)
      .where(
        or(
          eq(systemsTable.name, fields.value.name),
          eq(systemsTable.location, fields.value.location),
        ),
      )
      .limit(1)

    if (clash) {
      skipped.push(fields.value.name)
      continue
    }

    const hooks = parseJsonCell<ImportedHook>(row.hooks ?? '', 'hooks', rowNumber)
    if (typeof hooks === 'string') {
      errors.push(hooks)
      continue
    }
    const interactions = parseJsonCell<ImportedEntry>(
      row.traveller_interactions ?? '',
      'traveller_interactions',
      rowNumber,
    )
    if (typeof interactions === 'string') {
      errors.push(interactions)
      continue
    }
    const history = parseJsonCell<ImportedEntry>(
      row.timeline_history ?? '',
      'timeline_history',
      rowNumber,
    )
    if (typeof history === 'string') {
      errors.push(history)
      continue
    }

    const [system] = await db
      .insert(systemsTable)
      .values({
        name: fields.value.name,
        description: fields.value.description,
        techLevel: fields.value.techLevel,
        lawLevel: fields.value.lawLevel,
      location: fields.value.location,
      controllerFactionId: fields.value.controllerFactionId,
      notes: fields.value.notes,
        createdBy: viewerId,
      })
      .returning({ id: systemsTable.id })

    await replaceTraitLinks(
      systemTraitsTable,
      systemTraitsTable.systemId,
      'systemId',
      'traitId',
      system.id,
      fields.value.traitIds,
    )

    const hookValues = hooks.flatMap((hook) =>
      typeof hook.title === 'string' && hook.title.trim() !== ''
        ? [
            {
              systemId: system.id,
              title: hook.title.trim().slice(0, 200),
              description:
                typeof hook.description === 'string' ? hook.description.trim() : null,
              used: hook.used === true,
              createdBy: viewerId,
            },
          ]
        : [],
    )
    if (hookValues.length) await db.insert(systemHooksTable).values(hookValues)

    const interactionValues = interactions.flatMap((entry) => {
      const entryDate = normalizeTravellerDate(entry.date)
      if (!entryDate || typeof entry.event !== 'string' || entry.event.trim() === '') {
        return []
      }
      const raw = String(entry.date).trim()
      return [
        {
          systemId: system.id,
          entryDate,
          entryDateRaw: raw === entryDate ? null : raw,
          event: entry.event.trim(),
          recordedBy: viewerId,
        },
      ]
    })
    if (interactionValues.length) {
      await db.insert(systemInteractionsTable).values(interactionValues)
    }

    const historyValues = history.flatMap((entry) => {
      const entryDate = normalizeTravellerDate(entry.date)
      if (!entryDate || typeof entry.event !== 'string' || entry.event.trim() === '') {
        return []
      }
      const raw = String(entry.date).trim()
      return [
        {
          systemId: system.id,
          entryDate,
          entryDateRaw: raw === entryDate ? null : raw,
          event: entry.event.trim(),
          visibility: entry.visibility === 'gm_only' ? ('gm_only' as const) : ('public' as const),
          createdBy: viewerId,
        },
      ]
    })
    if (historyValues.length) {
      await db.insert(systemTimelineTable).values(historyValues)
    }

    created.push(fields.value.name)
  }

  return c.json({
    ok: errors.length === 0,
    created,
    skipped,
    errors,
  })
})

systems.route('/', relationships)

export default systems
