/**
 * Reads the relationship web hanging off a single system.
 *
 * `gm_only` rows are excluded at the query level for non-GM viewers, so a
 * player response cannot contain hidden relationships even by accident.
 */

import { and, eq, or, type SQL } from 'drizzle-orm'
import type { PgColumn } from 'drizzle-orm/pg-core'
import { db } from '../db/client'
import { systemsTable } from '../db/schema/systems'
import { factionsTable, factionTraitsTable } from '../db/schema/factions'
import { campaignNpcsTable, campaignNpcTraitsTable } from '../db/schema/campaignNpcs'
import { shipsTable, shipTraitsTable } from '../db/schema/ships'
import { patronsTable } from '../db/schema/patrons'
import { locationsTable, locationTraitsTable } from '../db/schema/locations'
import {
  systemFactionsTable,
  systemLinksTable,
  systemNpcsTable,
  systemPatronsTable,
  systemShipsTable,
} from '../db/schema/systemRelationships'
import { traitsByParent, type TraitRow } from './campaign-traits'
import {
  iso,
  toCampaignNpc,
  toFaction,
  toLocation,
  toPatron,
  toShip,
  toSystemRef,
} from './campaign-view'

const NO_TRAITS: TraitRow[] = []

/** Restrict a junction query to public rows unless the viewer is a GM. */
function visibilityScope(column: PgColumn, isGm: boolean): SQL | undefined {
  return isGm ? undefined : eq(column, 'public')
}

export async function loadSystemFactions(systemId: string, isGm: boolean) {
  const rows = await db
    .select({ presence: systemFactionsTable, faction: factionsTable })
    .from(systemFactionsTable)
    .innerJoin(factionsTable, eq(factionsTable.id, systemFactionsTable.factionId))
    .where(
      and(
        eq(systemFactionsTable.systemId, systemId),
        visibilityScope(systemFactionsTable.visibility, isGm),
      ),
    )

  const traits = await traitsByParent(
    factionTraitsTable,
    factionTraitsTable.factionId,
    factionTraitsTable.traitId,
    rows.map((row) => row.faction.id),
  )

  return rows
    .map(({ presence, faction }) => ({
      id: presence.id,
      systemId: presence.systemId,
      factionId: presence.factionId,
      presenceType: presence.presenceType,
      influence: presence.influence,
      relationshipToParty: presence.relationshipToParty,
      notes: presence.notes,
      visibility: presence.visibility,
      faction: toFaction(faction, traits.get(faction.id) ?? NO_TRAITS, isGm),
      createdBy: presence.createdBy,
      createdAt: iso(presence.createdAt),
      updatedAt: iso(presence.updatedAt),
    }))
    .sort(
      (a, b) => b.influence - a.influence || a.faction.name.localeCompare(b.faction.name),
    )
}

export async function loadSystemNpcs(systemId: string, isGm: boolean) {
  const rows = await db
    .select({ presence: systemNpcsTable, npc: campaignNpcsTable })
    .from(systemNpcsTable)
    .innerJoin(campaignNpcsTable, eq(campaignNpcsTable.id, systemNpcsTable.npcId))
    .where(
      and(
        eq(systemNpcsTable.systemId, systemId),
        visibilityScope(systemNpcsTable.visibility, isGm),
      ),
    )

  const traits = await traitsByParent(
    campaignNpcTraitsTable,
    campaignNpcTraitsTable.npcId,
    campaignNpcTraitsTable.traitId,
    rows.map((row) => row.npc.id),
  )

  return rows
    .map(({ presence, npc }) => ({
      id: presence.id,
      systemId: presence.systemId,
      npcId: presence.npcId,
      connectionType: presence.connectionType,
      currentStatus: presence.currentStatus,
      arrivalDate: presence.arrivalDate,
      departureDate: presence.departureDate,
      notes: presence.notes,
      visibility: presence.visibility,
      npc: toCampaignNpc(npc, traits.get(npc.id) ?? NO_TRAITS, isGm),
      createdBy: presence.createdBy,
      createdAt: iso(presence.createdAt),
      updatedAt: iso(presence.updatedAt),
    }))
    .sort((a, b) => a.npc.name.localeCompare(b.npc.name))
}

export async function loadSystemShips(systemId: string, isGm: boolean) {
  const rows = await db
    .select({
      visit: systemShipsTable,
      ship: shipsTable,
      dockedAt: locationsTable,
    })
    .from(systemShipsTable)
    .innerJoin(shipsTable, eq(shipsTable.id, systemShipsTable.shipId))
    .leftJoin(locationsTable, eq(locationsTable.id, systemShipsTable.dockedAtLocationId))
    .where(
      and(
        eq(systemShipsTable.systemId, systemId),
        visibilityScope(systemShipsTable.visibility, isGm),
      ),
    )

  const traits = await traitsByParent(
    shipTraitsTable,
    shipTraitsTable.shipId,
    shipTraitsTable.traitId,
    rows.map((row) => row.ship.id),
  )

  return rows
    .map(({ visit, ship, dockedAt }) => ({
      id: visit.id,
      systemId: visit.systemId,
      shipId: visit.shipId,
      dockedAtLocationId: visit.dockedAtLocationId,
      dockedAt: dockedAt ? { id: dockedAt.id, name: dockedAt.name } : null,
      arrivalDate: visit.arrivalDate,
      departureDate: visit.departureDate,
      purpose: visit.purpose,
      status: visit.status,
      notes: visit.notes,
      visibility: visit.visibility,
      ship: toShip(ship, traits.get(ship.id) ?? NO_TRAITS, isGm),
      createdBy: visit.createdBy,
      createdAt: iso(visit.createdAt),
      updatedAt: iso(visit.updatedAt),
    }))
    .sort((a, b) => a.ship.name.localeCompare(b.ship.name))
}

export async function loadSystemPatrons(systemId: string, isGm: boolean) {
  const rows = await db
    .select({
      offer: systemPatronsTable,
      patron: patronsTable,
      npc: campaignNpcsTable,
    })
    .from(systemPatronsTable)
    .innerJoin(patronsTable, eq(patronsTable.id, systemPatronsTable.patronId))
    .innerJoin(campaignNpcsTable, eq(campaignNpcsTable.id, patronsTable.npcId))
    .where(
      and(
        eq(systemPatronsTable.systemId, systemId),
        visibilityScope(systemPatronsTable.visibility, isGm),
      ),
    )

  const traits = await traitsByParent(
    campaignNpcTraitsTable,
    campaignNpcTraitsTable.npcId,
    campaignNpcTraitsTable.traitId,
    rows.map((row) => row.npc.id),
  )

  return rows
    .map(({ offer, patron, npc }) => ({
      id: offer.id,
      systemId: offer.systemId,
      patronId: offer.patronId,
      availability: offer.availability,
      jobSummary: offer.jobSummary,
      reward: offer.reward,
      difficulty: offer.difficulty,
      legalStatus: offer.legalStatus,
      notes: offer.notes,
      visibility: offer.visibility,
      patron: toPatron(
        patron,
        toCampaignNpc(npc, traits.get(npc.id) ?? NO_TRAITS, isGm),
        isGm,
      ),
      createdBy: offer.createdBy,
      createdAt: iso(offer.createdAt),
      updatedAt: iso(offer.updatedAt),
    }))
    .sort((a, b) => a.patron.npc!.name.localeCompare(b.patron.npc!.name))
}

export async function loadSystemLocations(systemId: string, isGm: boolean) {
  const rows = await db
    .select()
    .from(locationsTable)
    .where(eq(locationsTable.systemId, systemId))

  const traits = await traitsByParent(
    locationTraitsTable,
    locationTraitsTable.locationId,
    locationTraitsTable.traitId,
    rows.map((row) => row.id),
  )

  return rows
    .map((row) => toLocation(row, traits.get(row.id) ?? NO_TRAITS, isGm))
    .sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Links where this system is either end. `direction` tells the UI whether the
 * system is the origin or the destination of the recorded relationship.
 */
export async function loadSystemConnections(systemId: string, isGm: boolean) {
  const rows = await db
    .select({ link: systemLinksTable })
    .from(systemLinksTable)
    .where(
      and(
        or(
          eq(systemLinksTable.fromSystemId, systemId),
          eq(systemLinksTable.toSystemId, systemId),
        ),
        visibilityScope(systemLinksTable.visibility, isGm),
      ),
    )

  if (rows.length === 0) return []

  const otherIds = [
    ...new Set(
      rows.map(({ link }) =>
        link.fromSystemId === systemId ? link.toSystemId : link.fromSystemId,
      ),
    ),
  ]

  const others = await db
    .select({
      id: systemsTable.id,
      name: systemsTable.name,
      location: systemsTable.location,
    })
    .from(systemsTable)
    .where(
      otherIds.length === 1
        ? eq(systemsTable.id, otherIds[0])
        : or(...otherIds.map((id) => eq(systemsTable.id, id))),
    )

  const byId = new Map(others.map((row) => [row.id, toSystemRef(row)]))

  return rows
    .map(({ link }) => {
      const outbound = link.fromSystemId === systemId
      const otherId = outbound ? link.toSystemId : link.fromSystemId
      return {
        id: link.id,
        fromSystemId: link.fromSystemId,
        toSystemId: link.toSystemId,
        direction: outbound ? ('outbound' as const) : ('inbound' as const),
        other: byId.get(otherId) ?? null,
        relationshipType: link.relationshipType,
        strength: link.strength,
        active: link.active,
        notes: link.notes,
        visibility: link.visibility,
        createdBy: link.createdBy,
        createdAt: iso(link.createdAt),
        updatedAt: iso(link.updatedAt),
      }
    })
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        (a.other?.name ?? '').localeCompare(b.other?.name ?? ''),
    )
}

/** Everything the Relationships tab renders, in one round of queries. */
export async function loadSystemRelationships(systemId: string, isGm: boolean) {
  const [factions, npcs, ships, patrons, locations, connections] = await Promise.all([
    loadSystemFactions(systemId, isGm),
    loadSystemNpcs(systemId, isGm),
    loadSystemShips(systemId, isGm),
    loadSystemPatrons(systemId, isGm),
    loadSystemLocations(systemId, isGm),
    loadSystemConnections(systemId, isGm),
  ])

  return { factions, npcs, ships, patrons, locations, connections }
}
