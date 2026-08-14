import { Hono } from 'hono'
import { eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import {
  charactersTable,
  characterFeatsTable,
  characterConditionsTable,
  characterCriticalInjuriesTable,
  characterEquipmentTable,
  type CharacterSkill,
} from '../db/schema/characters'
import { featsTable } from '../db/schema/feats'
import { conditionsTable } from '../db/schema/conditions'
import { criticalInjuryTable } from '../db/schema/criticalInjury'
import { equipmentTable } from '../db/schema/equipment'
import {
  validateFeatSelections,
  type FeatRequirement,
} from '../lib/feat-requirements'
import {
  canAccessCharacter,
  requireInternalAuth,
  type AuthVariables,
} from '../lib/internal-auth'

const characters = new Hono<{ Variables: AuthVariables }>()

characters.use('*', requireInternalAuth)

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

function asNonNegInt(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) return null
  return value
}

function parseSkills(value: unknown): CharacterSkill[] | null {
  if (value === undefined) return null
  if (!Array.isArray(value)) return null
  const skills: CharacterSkill[] = []
  const seen = new Set<string>()

  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const nameRaw = (item as { name?: unknown }).name
    const level = (item as { level?: unknown }).level
    const languageRaw = (item as { language?: unknown }).language

    if (typeof nameRaw !== 'string' || nameRaw.trim() === '') return null
    if (typeof level !== 'number' || !Number.isInteger(level) || level < 0) return null

    const name = nameRaw.trim()
    const isLanguage = name.toLowerCase() === 'language'
    let language: string | undefined

    if (isLanguage) {
      if (typeof languageRaw !== 'string' || languageRaw.trim() === '') return null
      language = languageRaw.trim()
    } else if (languageRaw != null && languageRaw !== '') {
      return null
    }

    const key = isLanguage
      ? `language::${language!.toLowerCase()}`
      : name.toLowerCase()
    if (seen.has(key)) return null
    seen.add(key)

    skills.push(language ? { name, level, language } : { name, level })
  }
  return skills
}

function parseStringArray(value: unknown): string[] | null {
  if (value === undefined) return null
  if (!Array.isArray(value)) return null
  if (!value.every((v) => typeof v === 'string')) return null
  return value
}

function parseFeatIds(value: unknown): string[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null
  if (!value.every(isUuid)) return null
  return [...new Set(value)]
}

type EquipmentLoadoutEntry = {
  equipmentId: string
  quantity: number
}

function parseEquipmentLoadout(value: unknown): EquipmentLoadoutEntry[] | null {
  if (value === undefined) return []
  if (!Array.isArray(value)) return null

  if (value.every(isUuid)) {
    return [...new Set(value)].map((equipmentId) => ({ equipmentId, quantity: 1 }))
  }

  const byId = new Map<string, number>()
  for (const item of value) {
    if (!item || typeof item !== 'object') return null
    const equipmentId =
      (item as { equipmentId?: unknown }).equipmentId ??
      (item as { id?: unknown }).id
    const quantityRaw = (item as { quantity?: unknown }).quantity ?? 1
    const quantity = asNonNegInt(quantityRaw)
    if (!isUuid(equipmentId) || quantity === null || quantity < 1) return null
    byId.set(equipmentId, quantity)
  }
  return [...byId.entries()].map(([equipmentId, quantity]) => ({
    equipmentId,
    quantity,
  }))
}

async function loadFeatsByIds(featIds: string[]) {
  if (featIds.length === 0) return []
  return db.select().from(featsTable).where(inArray(featsTable.id, featIds))
}

async function loadEquipmentByIds(equipmentIds: string[]) {
  if (equipmentIds.length === 0) return []
  return db.select().from(equipmentTable).where(inArray(equipmentTable.id, equipmentIds))
}

function assertFeatRequirements(
  featRows: { name: string; requirements: FeatRequirement | null }[],
  skills: CharacterSkill[],
): string | null {
  const result = validateFeatSelections(
    featRows.map((feat) => ({
      name: feat.name,
      requirements: feat.requirements ?? null,
    })),
    skills,
  )
  if (result.ok) return null
  return `Prerequisites not met for: ${result.unmet.join(', ')}`
}

function clampCurrent(current: number, max: number): number | null {
  if (current < 0 || current > max) return null
  return current
}

type CharacterRow = typeof charactersTable.$inferSelect

function toSummary(row: CharacterRow) {
  return {
    id: row.id,
    name: row.name,
    playerName: row.playerName,
    userId: row.userId,
    str: { max: row.strMax, current: row.strCurrent },
    dex: { max: row.dexMax, current: row.dexCurrent },
    end: { max: row.endMax, current: row.endCurrent },
    armorTotal: row.armorTotal,
  }
}

function toCore(row: CharacterRow) {
  return {
    id: row.id,
    name: row.name,
    playerName: row.playerName,
    userId: row.userId,
    str: { max: row.strMax, current: row.strCurrent },
    dex: { max: row.dexMax, current: row.dexCurrent },
    end: { max: row.endMax, current: row.endCurrent },
    int: row.int,
    soc: row.soc,
    edu: row.edu,
    skills: row.skills,
    movement: row.movement,
    armor: {
      total: row.armorTotal,
      bottom: row.armorBottom,
      top: row.armorTop,
      outer: row.armorOuter,
    },
    weapons: row.weapons,
    equipment: row.equipment,
    credits: row.credits,
    experience: row.experience,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function loadDetail(characterId: string) {
  const [row] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, characterId))
    .limit(1)

  if (!row) return null

  const [featRows, conditionRows, injuryRows, equipmentRows] = await Promise.all([
    db
      .select({ feat: featsTable })
      .from(characterFeatsTable)
      .innerJoin(featsTable, eq(featsTable.id, characterFeatsTable.featId))
      .where(eq(characterFeatsTable.characterId, characterId)),
    db
      .select({
        condition: conditionsTable,
        value: characterConditionsTable.value,
      })
      .from(characterConditionsTable)
      .innerJoin(conditionsTable, eq(conditionsTable.id, characterConditionsTable.conditionId))
      .where(eq(characterConditionsTable.characterId, characterId)),
    db
      .select({
        injury: criticalInjuryTable,
        notes: characterCriticalInjuriesTable.notes,
      })
      .from(characterCriticalInjuriesTable)
      .innerJoin(
        criticalInjuryTable,
        eq(criticalInjuryTable.id, characterCriticalInjuriesTable.criticalInjuryId),
      )
      .where(eq(characterCriticalInjuriesTable.characterId, characterId)),
    db
      .select({
        item: equipmentTable,
        quantity: characterEquipmentTable.quantity,
      })
      .from(characterEquipmentTable)
      .innerJoin(equipmentTable, eq(equipmentTable.id, characterEquipmentTable.equipmentId))
      .where(eq(characterEquipmentTable.characterId, characterId)),
  ])

  const equipmentItems = [...equipmentRows]
    .map(({ item, quantity }) => ({ ...item, quantity }))
    .sort((a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name))

  return {
    ...toCore(row),
    feats: featRows.map(({ feat }) => feat),
    conditions: conditionRows.map(({ condition, value }) => ({ ...condition, value })),
    criticalInjuries: injuryRows.map(({ injury, notes }) => ({ ...injury, notes })),
    equipmentItems,
  }
}

characters.get('/', async (c) => {
  const userId = c.get('userId')
  const userRole = c.get('userRole')

  const rows =
    userRole === 'admin'
      ? await db.select().from(charactersTable)
      : await db
          .select()
          .from(charactersTable)
          .where(eq(charactersTable.userId, userId))

  return c.json(rows.map(toSummary))
})

characters.get('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Invalid character id' }, 400)

  const [row] = await db
    .select({ userId: charactersTable.userId })
    .from(charactersTable)
    .where(eq(charactersTable.id, id))
    .limit(1)
  if (!row) return c.json({ error: 'Character not found' }, 404)

  if (!canAccessCharacter(c.get('userRole'), c.get('userId'), row.userId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  const detail = await loadDetail(id)
  if (!detail) return c.json({ error: 'Character not found' }, 404)
  return c.json(detail)
})

characters.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const b = body as Record<string, unknown>

  if (typeof b.name !== 'string' || b.name.trim() === '') {
    return c.json({ error: 'name is required' }, 400)
  }

  const strMax = asNonNegInt(b.strMax ?? (b.str as { max?: unknown } | undefined)?.max)
  const dexMax = asNonNegInt(b.dexMax ?? (b.dex as { max?: unknown } | undefined)?.max)
  const endMax = asNonNegInt(b.endMax ?? (b.end as { max?: unknown } | undefined)?.max)

  if (strMax === null || dexMax === null || endMax === null) {
    return c.json({ error: 'str/dex/end max must be non-negative integers' }, 400)
  }

  const strCurrentRaw = asNonNegInt(
    b.strCurrent ?? (b.str as { current?: unknown } | undefined)?.current ?? strMax,
  )
  const dexCurrentRaw = asNonNegInt(
    b.dexCurrent ?? (b.dex as { current?: unknown } | undefined)?.current ?? dexMax,
  )
  const endCurrentRaw = asNonNegInt(
    b.endCurrent ?? (b.end as { current?: unknown } | undefined)?.current ?? endMax,
  )

  if (strCurrentRaw === null || dexCurrentRaw === null || endCurrentRaw === null) {
    return c.json({ error: 'str/dex/end current must be non-negative integers' }, 400)
  }

  const strCurrent = clampCurrent(strCurrentRaw, strMax)
  const dexCurrent = clampCurrent(dexCurrentRaw, dexMax)
  const endCurrent = clampCurrent(endCurrentRaw, endMax)
  if (strCurrent === null || dexCurrent === null || endCurrent === null) {
    return c.json({ error: 'characteristic current must be between 0 and max' }, 400)
  }

  const intVal = asNonNegInt(b.int ?? 0)
  const socVal = asNonNegInt(b.soc ?? 0)
  const eduVal = asNonNegInt(b.edu ?? 0)
  if (intVal === null || socVal === null || eduVal === null) {
    return c.json({ error: 'int/soc/edu must be non-negative integers' }, 400)
  }

  const skills = b.skills === undefined ? [] : parseSkills(b.skills)
  if (skills === null) {
    return c.json({ error: 'skills must be an array of { name, level }' }, 400)
  }

  const weapons = b.weapons === undefined ? [] : parseStringArray(b.weapons)
  const equipment = b.equipment === undefined ? [] : parseStringArray(b.equipment)
  if (weapons === null || equipment === null) {
    return c.json({ error: 'weapons and equipment must be string arrays' }, 400)
  }

  const armor =
    b.armor && typeof b.armor === 'object' ? (b.armor as Record<string, unknown>) : null
  const armorTotal = asNonNegInt(b.armorTotal ?? armor?.total ?? 0)
  if (armorTotal === null) {
    return c.json({ error: 'armorTotal must be a non-negative integer' }, 400)
  }

  const credits = asNonNegInt(b.credits ?? 0)
  if (credits === null) {
    return c.json({ error: 'credits must be a non-negative integer' }, 400)
  }

  const experience = asNonNegInt(b.experience ?? 0)
  if (experience === null) {
    return c.json({ error: 'experience must be a non-negative integer' }, 400)
  }

  const featIds = parseFeatIds(b.featIds)
  if (featIds === null) {
    return c.json({ error: 'featIds must be an array of UUIDs' }, 400)
  }

  const equipmentLoadout = parseEquipmentLoadout(
    b.equipmentLoadout ?? b.equipmentIds,
  )
  if (equipmentLoadout === null) {
    return c.json({ error: 'equipmentLoadout must be an array of { equipmentId, quantity }' }, 400)
  }

  const featRows = await loadFeatsByIds(featIds)
  if (featRows.length !== featIds.length) {
    return c.json({ error: 'One or more feat ids do not exist' }, 400)
  }

  const equipmentIds = equipmentLoadout.map((entry) => entry.equipmentId)
  const equipmentRows = await loadEquipmentByIds(equipmentIds)
  if (equipmentRows.length !== equipmentIds.length) {
    return c.json({ error: 'One or more equipment ids do not exist' }, 400)
  }

  const requirementError = assertFeatRequirements(featRows, skills)
  if (requirementError) {
    return c.json({ error: requirementError }, 400)
  }

  const playerName =
    b.playerName === undefined || b.playerName === null
      ? null
      : typeof b.playerName === 'string'
        ? b.playerName
        : null
  if (b.playerName !== undefined && b.playerName !== null && typeof b.playerName !== 'string') {
    return c.json({ error: 'playerName must be a string' }, 400)
  }

  const [created] = await db
    .insert(charactersTable)
    .values({
      userId: c.get('userId'),
      name: b.name.trim(),
      playerName,
      strMax,
      strCurrent,
      dexMax,
      dexCurrent,
      endMax,
      endCurrent,
      int: intVal,
      soc: socVal,
      edu: eduVal,
      skills,
      movement: typeof b.movement === 'string' ? b.movement : null,
      armorTotal,
      armorBottom:
        typeof (b.armorBottom ?? armor?.bottom) === 'string'
          ? ((b.armorBottom ?? armor?.bottom) as string)
          : null,
      armorTop:
        typeof (b.armorTop ?? armor?.top) === 'string'
          ? ((b.armorTop ?? armor?.top) as string)
          : null,
      armorOuter:
        typeof (b.armorOuter ?? armor?.outer) === 'string'
          ? ((b.armorOuter ?? armor?.outer) as string)
          : null,
      weapons,
      equipment,
      credits,
      experience,
      notes: typeof b.notes === 'string' ? b.notes : null,
    })
    .returning()

  if (featIds.length > 0) {
    await db.insert(characterFeatsTable).values(
      featIds.map((featId) => ({ characterId: created.id, featId })),
    )
  }

  if (equipmentLoadout.length > 0) {
    await db.insert(characterEquipmentTable).values(
      equipmentLoadout.map((entry) => ({
        characterId: created.id,
        equipmentId: entry.equipmentId,
        quantity: entry.quantity,
      })),
    )
  }

  const detail = await loadDetail(created.id)
  return c.json(detail, 201)
})

characters.patch('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Invalid character id' }, 400)

  const [existing] = await db
    .select()
    .from(charactersTable)
    .where(eq(charactersTable.id, id))
    .limit(1)
  if (!existing) return c.json({ error: 'Character not found' }, 404)

  if (!canAccessCharacter(c.get('userRole'), c.get('userId'), existing.userId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }
  if (!body || typeof body !== 'object') {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const b = body as Record<string, unknown>
  const updates: Partial<typeof charactersTable.$inferInsert> = {
    updatedAt: new Date(),
  }

  if (b.name !== undefined) {
    if (typeof b.name !== 'string' || b.name.trim() === '') {
      return c.json({ error: 'name must be a non-empty string' }, 400)
    }
    updates.name = b.name.trim()
  }

  if (b.playerName !== undefined) {
    if (b.playerName !== null && typeof b.playerName !== 'string') {
      return c.json({ error: 'playerName must be a string or null' }, 400)
    }
    updates.playerName = b.playerName as string | null
  }

  const strMax = b.strMax ?? (b.str as { max?: unknown } | undefined)?.max
  const dexMax = b.dexMax ?? (b.dex as { max?: unknown } | undefined)?.max
  const endMax = b.endMax ?? (b.end as { max?: unknown } | undefined)?.max
  const strCurrent = b.strCurrent ?? (b.str as { current?: unknown } | undefined)?.current
  const dexCurrent = b.dexCurrent ?? (b.dex as { current?: unknown } | undefined)?.current
  const endCurrent = b.endCurrent ?? (b.end as { current?: unknown } | undefined)?.current

  const nextStrMax =
    strMax === undefined ? existing.strMax : asNonNegInt(strMax)
  const nextDexMax =
    dexMax === undefined ? existing.dexMax : asNonNegInt(dexMax)
  const nextEndMax =
    endMax === undefined ? existing.endMax : asNonNegInt(endMax)
  if (nextStrMax === null || nextDexMax === null || nextEndMax === null) {
    return c.json({ error: 'str/dex/end max must be non-negative integers' }, 400)
  }

  let nextStrCurrent =
    strCurrent === undefined ? existing.strCurrent : asNonNegInt(strCurrent)
  let nextDexCurrent =
    dexCurrent === undefined ? existing.dexCurrent : asNonNegInt(dexCurrent)
  let nextEndCurrent =
    endCurrent === undefined ? existing.endCurrent : asNonNegInt(endCurrent)
  if (nextStrCurrent === null || nextDexCurrent === null || nextEndCurrent === null) {
    return c.json({ error: 'str/dex/end current must be non-negative integers' }, 400)
  }

  // When only max is lowered, clamp current so the sheet stays valid.
  if (strCurrent === undefined && nextStrCurrent > nextStrMax) {
    nextStrCurrent = nextStrMax
  }
  if (dexCurrent === undefined && nextDexCurrent > nextDexMax) {
    nextDexCurrent = nextDexMax
  }
  if (endCurrent === undefined && nextEndCurrent > nextEndMax) {
    nextEndCurrent = nextEndMax
  }

  if (
    clampCurrent(nextStrCurrent, nextStrMax) === null ||
    clampCurrent(nextDexCurrent, nextDexMax) === null ||
    clampCurrent(nextEndCurrent, nextEndMax) === null
  ) {
    return c.json({ error: 'characteristic current must be between 0 and max' }, 400)
  }

  updates.strMax = nextStrMax
  updates.strCurrent = nextStrCurrent
  updates.dexMax = nextDexMax
  updates.dexCurrent = nextDexCurrent
  updates.endMax = nextEndMax
  updates.endCurrent = nextEndCurrent

  if (b.int !== undefined) {
    const v = asNonNegInt(b.int)
    if (v === null) return c.json({ error: 'int must be a non-negative integer' }, 400)
    updates.int = v
  }
  if (b.soc !== undefined) {
    const v = asNonNegInt(b.soc)
    if (v === null) return c.json({ error: 'soc must be a non-negative integer' }, 400)
    updates.soc = v
  }
  if (b.edu !== undefined) {
    const v = asNonNegInt(b.edu)
    if (v === null) return c.json({ error: 'edu must be a non-negative integer' }, 400)
    updates.edu = v
  }

  if (b.skills !== undefined) {
    const skills = parseSkills(b.skills)
    if (skills === null) {
      return c.json({ error: 'skills must be an array of { name, level }' }, 400)
    }
    updates.skills = skills
  }

  if (b.movement !== undefined) {
    if (b.movement !== null && typeof b.movement !== 'string') {
      return c.json({ error: 'movement must be a string or null' }, 400)
    }
    updates.movement = b.movement as string | null
  }

  const armor =
    b.armor && typeof b.armor === 'object' ? (b.armor as Record<string, unknown>) : null

  if (b.armorTotal !== undefined || armor?.total !== undefined) {
    const v = asNonNegInt(b.armorTotal ?? armor?.total)
    if (v === null) return c.json({ error: 'armorTotal must be a non-negative integer' }, 400)
    updates.armorTotal = v
  }

  if (b.armorBottom !== undefined || armor?.bottom !== undefined) {
    const v = b.armorBottom ?? armor?.bottom
    if (v !== null && typeof v !== 'string') {
      return c.json({ error: 'armor bottom must be a string or null' }, 400)
    }
    updates.armorBottom = v as string | null
  }
  if (b.armorTop !== undefined || armor?.top !== undefined) {
    const v = b.armorTop ?? armor?.top
    if (v !== null && typeof v !== 'string') {
      return c.json({ error: 'armor top must be a string or null' }, 400)
    }
    updates.armorTop = v as string | null
  }
  if (b.armorOuter !== undefined || armor?.outer !== undefined) {
    const v = b.armorOuter ?? armor?.outer
    if (v !== null && typeof v !== 'string') {
      return c.json({ error: 'armor outer must be a string or null' }, 400)
    }
    updates.armorOuter = v as string | null
  }

  if (b.weapons !== undefined) {
    const weapons = parseStringArray(b.weapons)
    if (weapons === null) return c.json({ error: 'weapons must be a string array' }, 400)
    updates.weapons = weapons
  }
  if (b.equipment !== undefined) {
    const equipment = parseStringArray(b.equipment)
    if (equipment === null) return c.json({ error: 'equipment must be a string array' }, 400)
    updates.equipment = equipment
  }

  if (b.credits !== undefined) {
    const v = asNonNegInt(b.credits)
    if (v === null) return c.json({ error: 'credits must be a non-negative integer' }, 400)
    updates.credits = v
  }

  if (b.experience !== undefined) {
    const v = asNonNegInt(b.experience)
    if (v === null) return c.json({ error: 'experience must be a non-negative integer' }, 400)
    updates.experience = v
  }

  if (b.notes !== undefined) {
    if (b.notes !== null && typeof b.notes !== 'string') {
      return c.json({ error: 'notes must be a string or null' }, 400)
    }
    updates.notes = b.notes as string | null
  }

  const featIds =
    b.featIds === undefined ? null : parseFeatIds(b.featIds)
  if (b.featIds !== undefined && featIds === null) {
    return c.json({ error: 'featIds must be an array of UUIDs' }, 400)
  }

  const equipmentLoadoutRaw = b.equipmentLoadout ?? b.equipmentIds
  const equipmentLoadout =
    equipmentLoadoutRaw === undefined
      ? null
      : parseEquipmentLoadout(equipmentLoadoutRaw)
  if (equipmentLoadoutRaw !== undefined && equipmentLoadout === null) {
    return c.json({ error: 'equipmentLoadout must be an array of { equipmentId, quantity }' }, 400)
  }

  let featRows: Awaited<ReturnType<typeof loadFeatsByIds>> | null = null
  if (featIds !== null) {
    featRows = await loadFeatsByIds(featIds)
    if (featRows.length !== featIds.length) {
      return c.json({ error: 'One or more feat ids do not exist' }, 400)
    }
    const skillsForReqs =
      updates.skills !== undefined
        ? (updates.skills as CharacterSkill[])
        : existing.skills
    const requirementError = assertFeatRequirements(featRows, skillsForReqs)
    if (requirementError) {
      return c.json({ error: requirementError }, 400)
    }
  }

  if (equipmentLoadout !== null) {
    const equipmentIds = equipmentLoadout.map((entry) => entry.equipmentId)
    const equipmentRows = await loadEquipmentByIds(equipmentIds)
    if (equipmentRows.length !== equipmentIds.length) {
      return c.json({ error: 'One or more equipment ids do not exist' }, 400)
    }
  }

  await db.update(charactersTable).set(updates).where(eq(charactersTable.id, id))

  if (featIds !== null) {
    await db.delete(characterFeatsTable).where(eq(characterFeatsTable.characterId, id))
    if (featIds.length > 0) {
      await db.insert(characterFeatsTable).values(
        featIds.map((featId) => ({ characterId: id, featId })),
      )
    }
  }

  if (equipmentLoadout !== null) {
    await db
      .delete(characterEquipmentTable)
      .where(eq(characterEquipmentTable.characterId, id))
    if (equipmentLoadout.length > 0) {
      await db.insert(characterEquipmentTable).values(
        equipmentLoadout.map((entry) => ({
          characterId: id,
          equipmentId: entry.equipmentId,
          quantity: entry.quantity,
        })),
      )
    }
  }

  const detail = await loadDetail(id)
  return c.json(detail)
})

characters.put('/:id/feats', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Invalid character id' }, 400)

  const [existing] = await db
    .select({
      id: charactersTable.id,
      skills: charactersTable.skills,
      userId: charactersTable.userId,
    })
    .from(charactersTable)
    .where(eq(charactersTable.id, id))
    .limit(1)
  if (!existing) return c.json({ error: 'Character not found' }, 404)

  if (!canAccessCharacter(c.get('userRole'), c.get('userId'), existing.userId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const rawFeatIds = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { featIds?: unknown }).featIds)
      ? (body as { featIds: unknown[] }).featIds
      : null

  if (!rawFeatIds || !rawFeatIds.every(isUuid)) {
    return c.json({ error: 'Body must be a UUID array or { featIds: UUID[] }' }, 400)
  }

  const uniqueIds = [...new Set(rawFeatIds)]
  const featRows = await loadFeatsByIds(uniqueIds)
  if (featRows.length !== uniqueIds.length) {
    return c.json({ error: 'One or more feat ids do not exist' }, 400)
  }

  const requirementError = assertFeatRequirements(featRows, existing.skills)
  if (requirementError) {
    return c.json({ error: requirementError }, 400)
  }

  await db.delete(characterFeatsTable).where(eq(characterFeatsTable.characterId, id))
  if (uniqueIds.length > 0) {
    await db.insert(characterFeatsTable).values(
      uniqueIds.map((featId) => ({ characterId: id, featId })),
    )
  }

  await db
    .update(charactersTable)
    .set({ updatedAt: new Date() })
    .where(eq(charactersTable.id, id))

  return c.json(await loadDetail(id))
})

characters.put('/:id/conditions', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Invalid character id' }, 400)

  const [existing] = await db
    .select({ id: charactersTable.id, userId: charactersTable.userId })
    .from(charactersTable)
    .where(eq(charactersTable.id, id))
    .limit(1)
  if (!existing) return c.json({ error: 'Character not found' }, 404)

  if (!canAccessCharacter(c.get('userRole'), c.get('userId'), existing.userId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const items = Array.isArray(body)
    ? body
    : body && typeof body === 'object' && Array.isArray((body as { conditions?: unknown }).conditions)
      ? (body as { conditions: unknown[] }).conditions
      : null

  if (!items) {
    return c.json({ error: 'Body must be an array or { conditions: [...] }' }, 400)
  }

  const parsed: { conditionId: string; value: number | null }[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return c.json({ error: 'Each condition needs conditionId' }, 400)
    }
    const conditionId = (item as { conditionId?: unknown }).conditionId
    const value = (item as { value?: unknown }).value
    if (!isUuid(conditionId)) {
      return c.json({ error: 'Each condition needs a valid conditionId' }, 400)
    }
    if (value !== undefined && value !== null) {
      const v = asNonNegInt(value)
      if (v === null) return c.json({ error: 'condition value must be a non-negative integer' }, 400)
      parsed.push({ conditionId, value: v })
    } else {
      parsed.push({ conditionId, value: null })
    }
  }

  const uniqueIds = [...new Set(parsed.map((p) => p.conditionId))]
  if (uniqueIds.length !== parsed.length) {
    return c.json({ error: 'Duplicate condition ids are not allowed' }, 400)
  }
  if (uniqueIds.length > 0) {
    const found = await db
      .select({ id: conditionsTable.id })
      .from(conditionsTable)
      .where(inArray(conditionsTable.id, uniqueIds))
    if (found.length !== uniqueIds.length) {
      return c.json({ error: 'One or more condition ids do not exist' }, 400)
    }
  }

  await db
    .delete(characterConditionsTable)
    .where(eq(characterConditionsTable.characterId, id))
  if (parsed.length > 0) {
    await db.insert(characterConditionsTable).values(
      parsed.map((p) => ({
        characterId: id,
        conditionId: p.conditionId,
        value: p.value,
      })),
    )
  }

  await db
    .update(charactersTable)
    .set({ updatedAt: new Date() })
    .where(eq(charactersTable.id, id))

  return c.json(await loadDetail(id))
})

characters.put('/:id/critical-injuries', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Invalid character id' }, 400)

  const [existing] = await db
    .select({ id: charactersTable.id, userId: charactersTable.userId })
    .from(charactersTable)
    .where(eq(charactersTable.id, id))
    .limit(1)
  if (!existing) return c.json({ error: 'Character not found' }, 404)

  if (!canAccessCharacter(c.get('userRole'), c.get('userId'), existing.userId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const items = Array.isArray(body)
    ? body
    : body &&
        typeof body === 'object' &&
        Array.isArray((body as { criticalInjuries?: unknown }).criticalInjuries)
      ? (body as { criticalInjuries: unknown[] }).criticalInjuries
      : null

  if (!items) {
    return c.json({ error: 'Body must be an array or { criticalInjuries: [...] }' }, 400)
  }

  const parsed: { criticalInjuryId: string; notes: string | null }[] = []
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      return c.json({ error: 'Each injury needs criticalInjuryId' }, 400)
    }
    const criticalInjuryId = (item as { criticalInjuryId?: unknown }).criticalInjuryId
    const notes = (item as { notes?: unknown }).notes
    if (!isUuid(criticalInjuryId)) {
      return c.json({ error: 'Each injury needs a valid criticalInjuryId' }, 400)
    }
    if (notes !== undefined && notes !== null && typeof notes !== 'string') {
      return c.json({ error: 'notes must be a string or null' }, 400)
    }
    parsed.push({
      criticalInjuryId,
      notes: typeof notes === 'string' ? notes : null,
    })
  }

  const uniqueIds = [...new Set(parsed.map((p) => p.criticalInjuryId))]
  if (uniqueIds.length !== parsed.length) {
    return c.json({ error: 'Duplicate critical injury ids are not allowed' }, 400)
  }
  if (uniqueIds.length > 0) {
    const found = await db
      .select({ id: criticalInjuryTable.id })
      .from(criticalInjuryTable)
      .where(inArray(criticalInjuryTable.id, uniqueIds))
    if (found.length !== uniqueIds.length) {
      return c.json({ error: 'One or more critical injury ids do not exist' }, 400)
    }
  }

  await db
    .delete(characterCriticalInjuriesTable)
    .where(eq(characterCriticalInjuriesTable.characterId, id))
  if (parsed.length > 0) {
    await db.insert(characterCriticalInjuriesTable).values(
      parsed.map((p) => ({
        characterId: id,
        criticalInjuryId: p.criticalInjuryId,
        notes: p.notes,
      })),
    )
  }

  await db
    .update(charactersTable)
    .set({ updatedAt: new Date() })
    .where(eq(charactersTable.id, id))

  return c.json(await loadDetail(id))
})

characters.delete('/:id', async (c) => {
  const id = c.req.param('id')
  if (!isUuid(id)) return c.json({ error: 'Invalid character id' }, 400)

  const [existing] = await db
    .select({ id: charactersTable.id, userId: charactersTable.userId })
    .from(charactersTable)
    .where(eq(charactersTable.id, id))
    .limit(1)
  if (!existing) return c.json({ error: 'Character not found' }, 404)

  if (!canAccessCharacter(c.get('userRole'), c.get('userId'), existing.userId)) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  await db.delete(charactersTable).where(eq(charactersTable.id, id))
  return c.json({ ok: true, id })
})

export default characters
