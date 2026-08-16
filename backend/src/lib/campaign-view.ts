/**
 * Row → JSON shapes for the campaign world API.
 *
 * GM-only fields (`notes`) are omitted rather than nulled when the viewer is not
 * a Game Master, so a player response never carries the key at all.
 */

import type { systemsTable } from '../db/schema/systems'
import type { factionsTable } from '../db/schema/factions'
import type { campaignNpcsTable } from '../db/schema/campaignNpcs'
import type { shipsTable } from '../db/schema/ships'
import type { patronsTable } from '../db/schema/patrons'
import type { locationsTable } from '../db/schema/locations'
import type { TraitRow } from './campaign-traits'

export type SystemRow = typeof systemsTable.$inferSelect
export type FactionRow = typeof factionsTable.$inferSelect
export type CampaignNpcRow = typeof campaignNpcsTable.$inferSelect
export type ShipRow = typeof shipsTable.$inferSelect
export type PatronRow = typeof patronsTable.$inferSelect
export type LocationRow = typeof locationsTable.$inferSelect

export const iso = (value: Date) => value.toISOString()

/** Spreads `{ notes }` only for Game Masters. */
export const gmNotes = (isGm: boolean, notes: string | null) =>
  isGm ? { notes } : {}

export type SystemRef = {
  id: string
  name: string
  location: string
}

export type FactionRef = {
  id: string
  name: string
  type: FactionRow['type']
}

export function toSystemRef(row: Pick<SystemRow, 'id' | 'name' | 'location'>): SystemRef {
  return { id: row.id, name: row.name, location: row.location }
}

export function toFactionRef(
  row: Pick<FactionRow, 'id' | 'name' | 'type'>,
): FactionRef {
  return { id: row.id, name: row.name, type: row.type }
}

export function toFaction(
  row: FactionRow,
  traits: TraitRow[],
  isGm: boolean,
  headquarters: SystemRef | null = null,
) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    description: row.description,
    tier: row.tier,
    headquartersSystemId: row.headquartersSystemId,
    headquarters,
    goals: row.goals,
    assets: row.assets,
    traits,
    ...gmNotes(isGm, row.notes),
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export function toCampaignNpc(
  row: CampaignNpcRow,
  traits: TraitRow[],
  isGm: boolean,
  currentLocation: SystemRef | null = null,
  allegiance: { id: string; name: string } | null = null,
) {
  return {
    id: row.id,
    name: row.name,
    occupation: row.occupation,
    upp: row.upp,
    description: row.description,
    currentLocationSystemId: row.currentLocationSystemId,
    currentLocation,
    status: row.status,
    allegianceFactionId: row.allegianceFactionId,
    allegiance,
    traits,
    ...gmNotes(isGm, row.notes),
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export function toShip(
  row: ShipRow,
  traits: TraitRow[],
  isGm: boolean,
  ownerFaction: { id: string; name: string } | null = null,
  ownerNpc: { id: string; name: string } | null = null,
  currentSystem: SystemRef | null = null,
) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    registration: row.registration,
    ownerFactionId: row.ownerFactionId,
    ownerFaction,
    ownerNpcId: row.ownerNpcId,
    ownerNpc,
    currentSystemId: row.currentSystemId,
    currentSystem,
    status: row.status,
    traits,
    ...gmNotes(isGm, row.notes),
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export function toPatron(
  row: PatronRow,
  npc: ReturnType<typeof toCampaignNpc> | null,
  isGm: boolean,
) {
  return {
    id: row.id,
    npcId: row.npcId,
    npc,
    reputation: row.reputation,
    paymentRecord: row.paymentRecord,
    jobTypes: row.jobTypes,
    riskTolerance: row.riskTolerance,
    ...gmNotes(isGm, row.notes),
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}

export function toLocation(row: LocationRow, traits: TraitRow[], isGm: boolean) {
  return {
    id: row.id,
    systemId: row.systemId,
    name: row.name,
    type: row.type,
    description: row.description,
    securityLevel: row.securityLevel,
    traits,
    ...gmNotes(isGm, row.notes),
    createdBy: row.createdBy,
    createdAt: iso(row.createdAt),
    updatedAt: iso(row.updatedAt),
  }
}
