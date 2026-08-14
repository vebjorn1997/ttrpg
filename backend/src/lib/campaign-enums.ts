/**
 * Closed value sets for the systems / relationships module.
 *
 * The database stores these as varchar rather than native Postgres enums, in
 * keeping with the rest of the schema. Drizzle `$type<>()` gives compile-time
 * safety and `isOneOf` guards the runtime boundary at the request handlers.
 */

export const VISIBILITIES = ['public', 'gm_only'] as const
export type Visibility = (typeof VISIBILITIES)[number]

export const FACTION_TYPES = [
  'government',
  'corporation',
  'criminal',
  'religious',
  'military',
  'political',
  'guild',
  'other',
] as const
export type FactionType = (typeof FACTION_TYPES)[number]

export const NPC_STATUSES = [
  'alive',
  'dead',
  'missing',
  'imprisoned',
  'retired',
] as const
export type NpcStatus = (typeof NPC_STATUSES)[number]

export const SHIP_STATUSES = [
  'active',
  'destroyed',
  'missing',
  'docked',
  'in_transit',
] as const
export type ShipStatus = (typeof SHIP_STATUSES)[number]

export const PAYMENT_RECORDS = [
  'prompt',
  'slow',
  'stiffed',
  'generous',
  'variable',
] as const
export type PaymentRecord = (typeof PAYMENT_RECORDS)[number]

export const RISK_TOLERANCES = [
  'safe',
  'moderate',
  'dangerous',
  'suicidal',
] as const
export type RiskTolerance = (typeof RISK_TOLERANCES)[number]

export const LOCATION_TYPES = [
  'starport',
  'city',
  'outpost',
  'research_station',
  'mining_facility',
  'orbital',
  'ruin',
  'other',
] as const
export type LocationType = (typeof LOCATION_TYPES)[number]

export const PRESENCE_TYPES = [
  'headquarters',
  'major_base',
  'minor_base',
  'cell',
  'embassy',
  'trade_office',
  'covert',
  'rival',
] as const
export type PresenceType = (typeof PRESENCE_TYPES)[number]

export const PARTY_RELATIONSHIPS = [
  'friendly',
  'neutral',
  'hostile',
  'unknown',
  'allied',
  'enemy',
] as const
export type PartyRelationship = (typeof PARTY_RELATIONSHIPS)[number]

export const NPC_CONNECTION_TYPES = [
  'resident',
  'visitor',
  'native',
  'exile',
  'prisoner',
  'official',
  'fugitive',
  'deceased_here',
] as const
export type NpcConnectionType = (typeof NPC_CONNECTION_TYPES)[number]

export const SHIP_VISIT_PURPOSES = [
  'trade',
  'patrol',
  'refuge',
  'repair',
  'passenger',
  'smuggling',
  'military',
  'other',
] as const
export type ShipVisitPurpose = (typeof SHIP_VISIT_PURPOSES)[number]

export const SHIP_VISIT_STATUSES = [
  'docked',
  'orbiting',
  'landed',
  'departed',
  'impounded',
  'destroyed_here',
] as const
export type ShipVisitStatus = (typeof SHIP_VISIT_STATUSES)[number]

export const PATRON_AVAILABILITIES = [
  'available',
  'completed',
  'failed',
  'in_progress',
  'withdrawn',
] as const
export type PatronAvailability = (typeof PATRON_AVAILABILITIES)[number]

export const JOB_DIFFICULTIES = ['easy', 'moderate', 'hard', 'extreme'] as const
export type JobDifficulty = (typeof JOB_DIFFICULTIES)[number]

export const LEGAL_STATUSES = ['legal', 'grey', 'illegal', 'varies'] as const
export type LegalStatus = (typeof LEGAL_STATUSES)[number]

export const SYSTEM_LINK_TYPES = [
  'trade_route',
  'alliance',
  'rivalry',
  'war',
  'protectorate',
  'cultural_tie',
  'migration',
  'smuggling_route',
  'military_corridor',
] as const
export type SystemLinkType = (typeof SYSTEM_LINK_TYPES)[number]

/** Narrows an untrusted request value to one of a closed set. */
export function isOneOf<const T extends readonly string[]>(
  allowed: T,
  value: unknown,
): value is T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}
