import { Hono } from 'hono'
import { and, asc, eq, ilike } from 'drizzle-orm'
import { db } from '../db/client'
import { patronsTable } from '../db/schema/patrons'
import { campaignNpcsTable, campaignNpcTraitsTable } from '../db/schema/campaignNpcs'
import { systemsTable } from '../db/schema/systems'
import { systemPatronsTable } from '../db/schema/systemRelationships'
import {
  attachViewer,
  isGameMaster,
  type ViewerVariables,
} from '../lib/internal-auth'
import { PAYMENT_RECORDS, RISK_TOLERANCES } from '../lib/campaign-enums'
import {
  isUuid,
  parseEnum,
  parseIntInRange,
  parseNullableText,
  parseStringList,
  parseUuid,
  readJsonBody,
} from '../lib/campaign-parse'
import { traitsByParent, type TraitRow } from '../lib/campaign-traits'
import {
  equipmentByNpc,
  type NpcEquipmentItem,
} from '../lib/campaign-equipment'
import { toCampaignNpc, toPatron, toSystemRef } from '../lib/campaign-view'

const patrons = new Hono<{ Variables: ViewerVariables }>()

patrons.use('*', attachViewer)

const NO_TRAITS: TraitRow[] = []
const NO_EQUIPMENT: NpcEquipmentItem[] = []

function baseQuery() {
  return db
    .select({ patron: patronsTable, npc: campaignNpcsTable })
    .from(patronsTable)
    .innerJoin(campaignNpcsTable, eq(campaignNpcsTable.id, patronsTable.npcId))
}

patrons.get('/', async (c) => {
  const isGm = isGameMaster(c.get('viewerRole'))
  const search = c.req.query('search')?.trim()

  const rows = await baseQuery()
    .where(search ? ilike(campaignNpcsTable.name, `%${search}%`) : undefined)
    .orderBy(asc(campaignNpcsTable.name))

  const npcIds = rows.map((row) => row.npc.id)
  const [traits, equipment] = await Promise.all([
    traitsByParent(
      campaignNpcTraitsTable,
      campaignNpcTraitsTable.npcId,
      campaignNpcTraitsTable.traitId,
      npcIds,
    ),
    equipmentByNpc(npcIds),
  ])

  return c.json(
    rows.map(({ patron, npc }) =>
      toPatron(
        patron,
        toCampaignNpc(
          npc,
          traits.get(npc.id) ?? NO_TRAITS,
          isGm,
          null,
          null,
          equipment.get(npc.id) ?? NO_EQUIPMENT,
        ),
        isGm,
      ),
    ),
  )
})

async function loadPatronDetail(id: string, isGm: boolean) {
  const [row] = await baseQuery().where(eq(patronsTable.id, id)).limit(1)
  if (!row) return null

  const [traits, equipment] = await Promise.all([
    traitsByParent(
      campaignNpcTraitsTable,
      campaignNpcTraitsTable.npcId,
      campaignNpcTraitsTable.traitId,
      [row.npc.id],
    ),
    equipmentByNpc([row.npc.id]),
  ])

  const offerRows = await db
    .select({ offer: systemPatronsTable, system: systemsTable })
    .from(systemPatronsTable)
    .innerJoin(systemsTable, eq(systemsTable.id, systemPatronsTable.systemId))
    .where(
      isGm
        ? eq(systemPatronsTable.patronId, id)
        : and(
            eq(systemPatronsTable.patronId, id),
            eq(systemPatronsTable.visibility, 'public'),
          ),
    )
    .orderBy(asc(systemsTable.name))

  return {
    ...toPatron(
      row.patron,
      toCampaignNpc(
        row.npc,
        traits.get(row.npc.id) ?? NO_TRAITS,
        isGm,
        null,
        null,
        equipment.get(row.npc.id) ?? NO_EQUIPMENT,
      ),
      isGm,
    ),
    offers: offerRows.map(({ offer, system }) => ({
      id: offer.id,
      system: toSystemRef(system),
      availability: offer.availability,
      jobSummary: offer.jobSummary,
      reward: offer.reward,
      difficulty: offer.difficulty,
      legalStatus: offer.legalStatus,
      notes: offer.notes,
      visibility: offer.visibility,
    })),
  }
}

patrons.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Patron not found' }, 404)

  const detail = await loadPatronDetail(id, isGameMaster(c.get('viewerRole')))
  if (!detail) return c.json({ error: 'Patron not found' }, 404)

  return c.json(detail)
})

type PatronFields = {
  npcId: string
  reputation: number
  paymentRecord: (typeof PAYMENT_RECORDS)[number]
  jobTypes: string[]
  riskTolerance: (typeof RISK_TOLERANCES)[number]
  notes: string | null
}

async function parsePatronBody(
  body: Record<string, unknown>,
): Promise<{ ok: true; value: PatronFields } | { ok: false; error: string }> {
  const npcId = parseUuid(body.npcId, 'npcId')
  if (!npcId.ok) return npcId

  const [npc] = await db
    .select({ id: campaignNpcsTable.id })
    .from(campaignNpcsTable)
    .where(eq(campaignNpcsTable.id, npcId.value))
    .limit(1)
  if (!npc) return { ok: false, error: 'NPC not found' }

  const reputation =
    body.reputation === undefined
      ? ({ ok: true, value: 0 } as const)
      : parseIntInRange(body.reputation, 'reputation', -5, 5)
  if (!reputation.ok) return reputation

  const paymentRecord =
    body.paymentRecord === undefined
      ? ({ ok: true, value: 'variable' } as const)
      : parseEnum(PAYMENT_RECORDS, body.paymentRecord, 'paymentRecord')
  if (!paymentRecord.ok) return paymentRecord

  const jobTypes = parseStringList(body.jobTypes, 'jobTypes')
  if (!jobTypes.ok) return jobTypes

  const riskTolerance =
    body.riskTolerance === undefined
      ? ({ ok: true, value: 'moderate' } as const)
      : parseEnum(RISK_TOLERANCES, body.riskTolerance, 'riskTolerance')
  if (!riskTolerance.ok) return riskTolerance

  const notes = parseNullableText(body.notes, 'notes')
  if (!notes.ok) return notes

  return {
    ok: true,
    value: {
      npcId: npcId.value,
      reputation: reputation.value,
      paymentRecord: paymentRecord.value,
      jobTypes: jobTypes.value,
      riskTolerance: riskTolerance.value,
      notes: notes.value,
    },
  }
}

patrons.post('/', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parsePatronBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [created] = await db
    .insert(patronsTable)
    .values({ ...fields.value, createdBy: c.get('viewerId') })
    .returning({ id: patronsTable.id })

  return c.json(await loadPatronDetail(created.id, true), 201)
})

patrons.put('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Patron not found' }, 404)

  const body = await readJsonBody(c.req)
  if (!body) return c.json({ error: 'Invalid JSON body' }, 400)

  const fields = await parsePatronBody(body)
  if (!fields.ok) return c.json({ error: fields.error }, 400)

  const [updated] = await db
    .update(patronsTable)
    .set({ ...fields.value, updatedAt: new Date() })
    .where(eq(patronsTable.id, id))
    .returning({ id: patronsTable.id })

  if (!updated) return c.json({ error: 'Patron not found' }, 404)

  return c.json(await loadPatronDetail(id, true))
})

patrons.delete('/:id', async (c) => {
  if (!isGameMaster(c.get('viewerRole'))) {
    return c.json({ error: 'Game Master access required' }, 403)
  }

  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Patron not found' }, 404)

  const [removed] = await db
    .delete(patronsTable)
    .where(eq(patronsTable.id, id))
    .returning({ id: patronsTable.id })

  if (!removed) return c.json({ error: 'Patron not found' }, 404)
  return c.json({ ok: true, id: removed.id })
})

export default patrons
