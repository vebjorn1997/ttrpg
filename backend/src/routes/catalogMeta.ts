import { count } from 'drizzle-orm'
import type { PgTable } from 'drizzle-orm/pg-core'
import { Hono } from 'hono'
import { db } from '../db/client'
import { actionsTable } from '../db/schema/actions'
import { calledShotsTable } from '../db/schema/calledShots'
import { campaignNpcsTable } from '../db/schema/campaignNpcs'
import { charactersTable } from '../db/schema/characters'
import { conditionsTable } from '../db/schema/conditions'
import { criticalInjuryTable } from '../db/schema/criticalInjury'
import { equipmentTable } from '../db/schema/equipment'
import { factionsTable } from '../db/schema/factions'
import { featsTable } from '../db/schema/feats'
import { healingTable } from '../db/schema/healing'
import { languagesTable } from '../db/schema/languages'
import { lawlevelTable } from '../db/schema/lawlevel'
import { miscellaneousTable } from '../db/schema/miscellaneous'
import { npcCatalogTable } from '../db/schema/npcCatalog'
import { patronsTable } from '../db/schema/patrons'
import { shipsTable } from '../db/schema/ships'
import { skillsTable } from '../db/schema/skills'
import { systemsTable } from '../db/schema/systems'
import { tlTable } from '../db/schema/tl'
import { traitsTable } from '../db/schema/traits'

const catalogMeta = new Hono()

async function rowsIn(table: PgTable): Promise<number> {
  const [row] = await db.select({ n: count() }).from(table)
  return Number(row.n)
}

catalogMeta.get('/counts', async (c) => {
  const [
    actions,
    conditions,
    calledShots,
    criticalInjuries,
    healing,
    feats,
    skills,
    npcs,
    traits,
    tl,
    languages,
    lawlevel,
    miscellaneous,
    equipment,
    characters,
    systems,
    factions,
    campaignNpcs,
    ships,
    patrons,
  ] = await Promise.all([
    rowsIn(actionsTable),
    rowsIn(conditionsTable),
    rowsIn(calledShotsTable),
    rowsIn(criticalInjuryTable),
    rowsIn(healingTable),
    rowsIn(featsTable),
    rowsIn(skillsTable),
    rowsIn(npcCatalogTable),
    rowsIn(traitsTable),
    rowsIn(tlTable),
    rowsIn(languagesTable),
    rowsIn(lawlevelTable),
    rowsIn(miscellaneousTable),
    rowsIn(equipmentTable),
    rowsIn(charactersTable),
    rowsIn(systemsTable),
    rowsIn(factionsTable),
    rowsIn(campaignNpcsTable),
    rowsIn(shipsTable),
    rowsIn(patronsTable),
  ])

  return c.json({
    actions,
    conditions,
    'called-shots': calledShots,
    'critical-injuries': criticalInjuries,
    healing,
    feats,
    skills,
    npcs,
    traits,
    tl,
    languages,
    lawlevel,
    miscellaneous,
    equipment,
    characters,
    systems,
    factions,
    'campaign-npcs': campaignNpcs,
    ships,
    patrons,
  })
})

type RuleLink = { module: string; id: string; title: string }

function titled(
  module: string,
  rows: { id: string; title: string | null }[],
): RuleLink[] {
  return rows.flatMap((row) => {
    const title = row.title?.trim()
    return title ? [{ module, id: row.id, title }] : []
  })
}

/**
 * Id + display title for every rules-glossary row. The frontend previously
 * pulled fourteen full collections just to build deep-links in body text.
 */
catalogMeta.get('/rule-index', async (c) => {
  const [
    actions,
    conditions,
    calledShots,
    injuries,
    healing,
    feats,
    skills,
    techLevels,
    languages,
    lawLevels,
    miscellaneous,
    equipment,
    npcs,
    traits,
  ] = await Promise.all([
    db.select({ id: actionsTable.id, title: actionsTable.name }).from(actionsTable),
    db.select({ id: conditionsTable.id, title: conditionsTable.name }).from(conditionsTable),
    db
      .select({ id: calledShotsTable.id, title: calledShotsTable.location })
      .from(calledShotsTable),
    db
      .select({ id: criticalInjuryTable.id, title: criticalInjuryTable.name })
      .from(criticalInjuryTable),
    db.select({ id: healingTable.id, title: healingTable.name }).from(healingTable),
    db.select({ id: featsTable.id, title: featsTable.name }).from(featsTable),
    db.select({ id: skillsTable.id, title: skillsTable.name }).from(skillsTable),
    db.select({ id: tlTable.id, title: tlTable.name }).from(tlTable),
    db.select({ id: languagesTable.id, title: languagesTable.name }).from(languagesTable),
    db.select({ id: lawlevelTable.id, title: lawlevelTable.name }).from(lawlevelTable),
    db
      .select({ id: miscellaneousTable.id, title: miscellaneousTable.name })
      .from(miscellaneousTable),
    db.select({ id: equipmentTable.id, title: equipmentTable.name }).from(equipmentTable),
    db.select({ id: npcCatalogTable.id, title: npcCatalogTable.name }).from(npcCatalogTable),
    db.select({ id: traitsTable.id, title: traitsTable.name }).from(traitsTable),
  ])

  return c.json([
    ...titled('actions', actions),
    ...titled('conditions', conditions),
    ...titled('called-shots', calledShots),
    ...titled('critical-injuries', injuries),
    ...titled('healing', healing),
    ...titled('feats', feats),
    ...titled('skills', skills),
    ...titled('tl', techLevels),
    ...titled('languages', languages),
    ...titled('lawlevel', lawLevels),
    ...titled('miscellaneous', miscellaneous),
    ...titled('equipment', equipment),
    ...titled('npcs', npcs),
    ...titled('traits', traits),
  ])
})

export default catalogMeta
