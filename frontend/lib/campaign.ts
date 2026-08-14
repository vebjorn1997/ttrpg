/**
 * Display vocabulary for the campaign world enums. The API speaks in snake_case
 * tokens; these turn them into the labels shown on screen and drive the option
 * lists in the relationship wizard and entity forms.
 */

import type {
  FactionType,
  JobDifficulty,
  LegalStatus,
  NpcConnectionType,
  NpcStatus,
  PartyRelationship,
  PatronAvailability,
  PaymentRecord,
  PresenceType,
  RiskTolerance,
  ShipStatus,
  ShipVisitPurpose,
  ShipVisitStatus,
  LocationType,
  SystemLinkType,
  Visibility,
} from "@/lib/api-types"

export type Option<T extends string> = { value: T; label: string }

/**
 * Shape every campaign world server action resolves to. Declared here rather
 * than beside the actions because a `"use server"` module may only export
 * async functions, and the forms need this at the top of `useActionState`.
 */
export type FormState = { error: string | null; success: string | null }

export const emptyFormState: FormState = { error: null, success: null }

/** Import report state for the systems CSV importer. */
export type ImportState = FormState & {
  report: {
    ok: boolean
    created: string[]
    skipped: string[]
    errors: string[]
  } | null
}

export const emptyImportState: ImportState = {
  error: null,
  success: null,
  report: null,
}

/** The six kinds of tie a system can have; drives the relationship wizard. */
export type RelationshipKind =
  | "faction"
  | "npc"
  | "ship"
  | "patron"
  | "location"
  | "connection"

function options<T extends string>(labels: Record<T, string>): Option<T>[] {
  return (Object.keys(labels) as T[]).map((value) => ({
    value,
    label: labels[value],
  }))
}

export const visibilityLabels: Record<Visibility, string> = {
  public: "Public",
  gm_only: "GM only",
}

export const factionTypeLabels: Record<FactionType, string> = {
  government: "Government",
  corporation: "Corporation",
  criminal: "Criminal",
  religious: "Religious",
  military: "Military",
  political: "Political",
  guild: "Guild",
  other: "Other",
}

export const npcStatusLabels: Record<NpcStatus, string> = {
  alive: "Alive",
  dead: "Dead",
  missing: "Missing",
  imprisoned: "Imprisoned",
  retired: "Retired",
}

export const shipStatusLabels: Record<ShipStatus, string> = {
  active: "Active",
  destroyed: "Destroyed",
  missing: "Missing",
  docked: "Docked",
  in_transit: "In transit",
}

export const paymentRecordLabels: Record<PaymentRecord, string> = {
  prompt: "Prompt",
  slow: "Slow",
  stiffed: "Stiffed the crew",
  generous: "Generous",
  variable: "Variable",
}

export const riskToleranceLabels: Record<RiskTolerance, string> = {
  safe: "Safe",
  moderate: "Moderate",
  dangerous: "Dangerous",
  suicidal: "Suicidal",
}

export const locationTypeLabels: Record<LocationType, string> = {
  starport: "Starport",
  city: "City",
  outpost: "Outpost",
  research_station: "Research station",
  mining_facility: "Mining facility",
  orbital: "Orbital",
  ruin: "Ruin",
  other: "Other",
}

export const presenceTypeLabels: Record<PresenceType, string> = {
  headquarters: "Headquarters",
  major_base: "Major base",
  minor_base: "Minor base",
  cell: "Cell",
  embassy: "Embassy",
  trade_office: "Trade office",
  covert: "Covert",
  rival: "Rival",
}

export const partyRelationshipLabels: Record<PartyRelationship, string> = {
  friendly: "Friendly",
  neutral: "Neutral",
  hostile: "Hostile",
  unknown: "Unknown",
  allied: "Allied",
  enemy: "Enemy",
}

export const npcConnectionLabels: Record<NpcConnectionType, string> = {
  resident: "Resident",
  visitor: "Visitor",
  native: "Native",
  exile: "Exile",
  prisoner: "Prisoner",
  official: "Official",
  fugitive: "Fugitive",
  deceased_here: "Died here",
}

export const shipPurposeLabels: Record<ShipVisitPurpose, string> = {
  trade: "Trade",
  patrol: "Patrol",
  refuge: "Refuge",
  repair: "Repair",
  passenger: "Passenger",
  smuggling: "Smuggling",
  military: "Military",
  other: "Other",
}

export const shipVisitStatusLabels: Record<ShipVisitStatus, string> = {
  docked: "Docked",
  orbiting: "Orbiting",
  landed: "Landed",
  departed: "Departed",
  impounded: "Impounded",
  destroyed_here: "Destroyed here",
}

export const patronAvailabilityLabels: Record<PatronAvailability, string> = {
  available: "Available",
  completed: "Completed",
  failed: "Failed",
  in_progress: "In progress",
  withdrawn: "Withdrawn",
}

export const jobDifficultyLabels: Record<JobDifficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  extreme: "Extreme",
}

export const legalStatusLabels: Record<LegalStatus, string> = {
  legal: "Legal",
  grey: "Grey",
  illegal: "Illegal",
  varies: "Varies",
}

export const systemLinkLabels: Record<SystemLinkType, string> = {
  trade_route: "Trade route",
  alliance: "Alliance",
  rivalry: "Rivalry",
  war: "War",
  protectorate: "Protectorate",
  cultural_tie: "Cultural tie",
  migration: "Migration",
  smuggling_route: "Smuggling route",
  military_corridor: "Military corridor",
}

function values<T extends string>(labels: Record<T, string>): readonly T[] {
  return Object.keys(labels) as T[]
}

/** Accepted values per enum, used by the server actions to validate input. */
export const factionTypes = values(factionTypeLabels)
export const npcStatuses = values(npcStatusLabels)
export const shipStatuses = values(shipStatusLabels)
export const paymentRecords = values(paymentRecordLabels)
export const riskTolerances = values(riskToleranceLabels)
export const locationTypes = values(locationTypeLabels)
export const presenceTypes = values(presenceTypeLabels)
export const partyRelationships = values(partyRelationshipLabels)
export const npcConnectionTypes = values(npcConnectionLabels)
export const shipPurposes = values(shipPurposeLabels)
export const shipVisitStatuses = values(shipVisitStatusLabels)
export const patronAvailabilities = values(patronAvailabilityLabels)
export const jobDifficulties = values(jobDifficultyLabels)
export const legalStatuses = values(legalStatusLabels)
export const systemLinkTypes = values(systemLinkLabels)

export const visibilityOptions = options(visibilityLabels)
export const factionTypeOptions = options(factionTypeLabels)
export const npcStatusOptions = options(npcStatusLabels)
export const shipStatusOptions = options(shipStatusLabels)
export const paymentRecordOptions = options(paymentRecordLabels)
export const riskToleranceOptions = options(riskToleranceLabels)
export const locationTypeOptions = options(locationTypeLabels)
export const presenceTypeOptions = options(presenceTypeLabels)
export const partyRelationshipOptions = options(partyRelationshipLabels)
export const npcConnectionOptions = options(npcConnectionLabels)
export const shipPurposeOptions = options(shipPurposeLabels)
export const shipVisitStatusOptions = options(shipVisitStatusLabels)
export const patronAvailabilityOptions = options(patronAvailabilityLabels)
export const jobDifficultyOptions = options(jobDifficultyLabels)
export const legalStatusOptions = options(legalStatusLabels)
export const systemLinkOptions = options(systemLinkLabels)

/**
 * Trait `type` values in the shared glossary, one per entity that can be
 * tagged. The pickers filter the glossary down to the relevant set.
 */
export const traitTypes = {
  system: "System",
  faction: "Faction",
  npc: "NPC",
  ship: "Ship",
  location: "Location",
} as const

/** Hostile relationships get the alert accent; allies get the friendly one. */
export function relationshipAccent(value: PartyRelationship): string {
  if (value === "hostile" || value === "enemy") return "text-oxide"
  if (value === "friendly" || value === "allied") return "text-viridian"
  return "text-muted-foreground"
}

/** Renders a 0–5 rating as filled and empty blocks. */
export function ratingBar(value: number, max = 5): string {
  const filled = Math.max(0, Math.min(max, value))
  return "█".repeat(filled) + "░".repeat(max - filled)
}

/**
 * Traveller dates are stored ISO but often entered as stardates. Show whichever
 * form the operator used, falling back to the normalised value.
 */
export function formatCampaignDate(display: string, iso: string): string {
  return display || iso
}
