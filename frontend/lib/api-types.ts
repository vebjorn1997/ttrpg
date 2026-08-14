import type { FeatRequirement } from "@/lib/feat-requirements"

export type Trait = {
  id: string
  name: string
  type: string
  color: string
  description: string
}

export type Action = {
  id: string
  name: string
  type: string
  cost: number
  description: string
  requiredFeat: { id: string; name: string } | null
}

export type Condition = {
  id: string
  name: string
  description: string
  traits: string[] | null
}

export type CalledShot = {
  id: string
  location: string
  cost: number
  penalty: number
  description: string
  traits: string[] | null
}

export type CriticalInjury = {
  id: string
  name: string
  description: string
  characteristic: string
  traits: string[] | null
}

export type Healing = {
  id: string
  name: string
  cost: string
  description: string
  traits: string[] | null
}

export type Feat = {
  id: string
  name: string
  description: string
  type: string
  prerequisites: string | null
  requirements: FeatRequirement | null
  cost: string
  traits: string[] | null
}

export type Skill = {
  id: string
  name: string
  description: string | null
  primaryCharacteristic: string
}

export type TechLevel = {
  id: string
  name: string
  level: number
  description: string | null
}

export type Language = {
  id: string
  name: string
  description: string | null
}

export type LawLevel = {
  id: string
  lawlevel: number
  name: string
  description: string | null
}

export type MiscellaneousRule = {
  id: string
  name: string
  sort: number
  description: string | null
}

export type Equipment = {
  id: string
  name: string
  cost: string | null
  category: string
  type: string
  trait: string | null
  weaponClassification: string | null
  description: string | null
  tl: string | null
  dmg: string | null
  armor: string | null
  mag: string | null
  range: string | null
}

export type CharacterEquipmentItem = Equipment & {
  quantity: number
  equipped: boolean
}

export type EquipmentLoadoutEntry = {
  equipmentId: string
  quantity: number
}

export type Npc = {
  id: string
  name: string
  movement: string
  hp: string
  armor: string
  features: string[]
  description: string | null
  traits: Trait[]
}

export type CharacteristicPair = {
  max: number
  current: number
}

export type CharacterSkill = {
  name: string
  level: number
  /** Set when `name` is Language — which tongue this rating applies to. */
  language?: string | null
}

export type CharacterSummary = {
  id: string
  name: string
  playerName: string | null
  userId: string | null
  str: CharacteristicPair
  dex: CharacteristicPair
  end: CharacteristicPair
  armorTotal: number
}

export type CharacterDetail = {
  id: string
  name: string
  playerName: string | null
  userId: string | null
  str: CharacteristicPair
  dex: CharacteristicPair
  end: CharacteristicPair
  int: number
  soc: number
  edu: number
  skills: CharacterSkill[]
  movement: string | null
  armor: {
    total: number
    bottom: string | null
    top: string | null
    outer: string | null
  }
  weapons: string[]
  equipment: string[]
  equipmentItems: CharacterEquipmentItem[]
  credits: number
  experience: number
  notes: string | null
  createdAt: string
  updatedAt: string
  feats: Feat[]
  conditions: (Condition & { value: number | null })[]
  criticalInjuries: (CriticalInjury & { notes: string | null })[]
}

export type CreateCharacterInput = {
  name: string
  playerName?: string | null
  str: CharacteristicPair
  dex: CharacteristicPair
  end: CharacteristicPair
  int?: number
  soc?: number
  edu?: number
  skills?: CharacterSkill[]
  featIds?: string[]
  equipmentLoadout?: EquipmentLoadoutEntry[]
  movement?: string | null
  armor?: {
    total?: number
    bottom?: string | null
    top?: string | null
    outer?: string | null
  }
  weapons?: string[]
  equipment?: string[]
  credits?: number
  experience?: number
  notes?: string | null
}

/** Partial sheet update — only send fields that should change. */
export type UpdateCharacterInput = {
  name?: string
  strMax?: number
  dexMax?: number
  endMax?: number
  skills?: CharacterSkill[]
  featIds?: string[]
  equipmentLoadout?: EquipmentLoadoutEntry[]
  experience?: number
}

/* -------------------------------------------------------------------------- */
/* Campaign world: systems & relationships                                    */
/* -------------------------------------------------------------------------- */

export type Visibility = "public" | "gm_only"

export type FactionType =
  | "government"
  | "corporation"
  | "criminal"
  | "religious"
  | "military"
  | "political"
  | "guild"
  | "other"

export type NpcStatus = "alive" | "dead" | "missing" | "imprisoned" | "retired"

export type ShipStatus =
  | "active"
  | "destroyed"
  | "missing"
  | "docked"
  | "in_transit"

export type PaymentRecord =
  | "prompt"
  | "slow"
  | "stiffed"
  | "generous"
  | "variable"

export type RiskTolerance = "safe" | "moderate" | "dangerous" | "suicidal"

export type LocationType =
  | "starport"
  | "city"
  | "outpost"
  | "research_station"
  | "mining_facility"
  | "orbital"
  | "ruin"
  | "other"

export type PresenceType =
  | "headquarters"
  | "major_base"
  | "minor_base"
  | "cell"
  | "embassy"
  | "trade_office"
  | "covert"
  | "rival"

export type PartyRelationship =
  | "friendly"
  | "neutral"
  | "hostile"
  | "unknown"
  | "allied"
  | "enemy"

export type NpcConnectionType =
  | "resident"
  | "visitor"
  | "native"
  | "exile"
  | "prisoner"
  | "official"
  | "fugitive"
  | "deceased_here"

export type ShipVisitPurpose =
  | "trade"
  | "patrol"
  | "refuge"
  | "repair"
  | "passenger"
  | "smuggling"
  | "military"
  | "other"

export type ShipVisitStatus =
  | "docked"
  | "orbiting"
  | "landed"
  | "departed"
  | "impounded"
  | "destroyed_here"

export type PatronAvailability =
  | "available"
  | "completed"
  | "failed"
  | "in_progress"
  | "withdrawn"

export type JobDifficulty = "easy" | "moderate" | "hard" | "extreme"

export type LegalStatus = "legal" | "grey" | "illegal" | "varies"

export type SystemLinkType =
  | "trade_route"
  | "alliance"
  | "rivalry"
  | "war"
  | "protectorate"
  | "cultural_tie"
  | "migration"
  | "smuggling_route"
  | "military_corridor"

/** Minimal system reference embedded in related records. */
export type SystemRef = {
  id: string
  name: string
  location: string
}

export type EntityRef = {
  id: string
  name: string
}

/** `notes` is only present on GM responses. */
export type Faction = {
  id: string
  name: string
  type: FactionType
  description: string | null
  tier: number | null
  headquartersSystemId: string | null
  headquarters: SystemRef | null
  goals: string | null
  assets: string[]
  traits: Trait[]
  notes?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type FactionDetail = Faction & {
  presences: {
    id: string
    system: SystemRef
    presenceType: PresenceType
    influence: number
    relationshipToParty: PartyRelationship
    notes: string | null
    visibility: Visibility
  }[]
}

export type CampaignNpc = {
  id: string
  name: string
  occupation: string | null
  upp: string | null
  description: string | null
  currentLocationSystemId: string | null
  currentLocation: SystemRef | null
  status: NpcStatus
  allegianceFactionId: string | null
  allegiance: EntityRef | null
  traits: Trait[]
  notes?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type CampaignNpcDetail = CampaignNpc & {
  presences: {
    id: string
    system: SystemRef
    connectionType: NpcConnectionType
    currentStatus: string | null
    arrivalDate: string | null
    departureDate: string | null
    notes: string | null
    visibility: Visibility
  }[]
  patronRoles: { id: string; riskTolerance: RiskTolerance }[]
}

export type Ship = {
  id: string
  name: string
  type: string | null
  registration: string | null
  ownerFactionId: string | null
  ownerFaction: EntityRef | null
  ownerNpcId: string | null
  ownerNpc: EntityRef | null
  currentSystemId: string | null
  currentSystem: SystemRef | null
  status: ShipStatus
  traits: Trait[]
  notes?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type ShipDetail = Ship & {
  visits: {
    id: string
    system: SystemRef
    arrivalDate: string | null
    departureDate: string | null
    purpose: ShipVisitPurpose | null
    status: ShipVisitStatus
    notes: string | null
    visibility: Visibility
  }[]
}

export type Patron = {
  id: string
  npcId: string
  npc: CampaignNpc | null
  reputation: number
  paymentRecord: PaymentRecord
  jobTypes: string[]
  riskTolerance: RiskTolerance
  notes?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type PatronDetail = Patron & {
  offers: {
    id: string
    system: SystemRef
    availability: PatronAvailability
    jobSummary: string | null
    reward: string | null
    difficulty: JobDifficulty | null
    legalStatus: LegalStatus | null
    notes: string | null
    visibility: Visibility
  }[]
}

export type SystemLocation = {
  id: string
  systemId: string
  name: string
  type: LocationType
  description: string | null
  securityLevel: number | null
  traits: Trait[]
  notes?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type SystemFactionPresence = {
  id: string
  systemId: string
  factionId: string
  presenceType: PresenceType
  influence: number
  relationshipToParty: PartyRelationship
  notes: string | null
  visibility: Visibility
  faction: Faction
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type SystemNpcPresence = {
  id: string
  systemId: string
  npcId: string
  connectionType: NpcConnectionType
  currentStatus: string | null
  arrivalDate: string | null
  departureDate: string | null
  notes: string | null
  visibility: Visibility
  npc: CampaignNpc
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type SystemShipVisit = {
  id: string
  systemId: string
  shipId: string
  dockedAtLocationId: string | null
  dockedAt: EntityRef | null
  arrivalDate: string | null
  departureDate: string | null
  purpose: ShipVisitPurpose | null
  status: ShipVisitStatus
  notes: string | null
  visibility: Visibility
  ship: Ship
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type SystemPatronOffer = {
  id: string
  systemId: string
  patronId: string
  availability: PatronAvailability
  jobSummary: string | null
  reward: string | null
  difficulty: JobDifficulty | null
  legalStatus: LegalStatus | null
  notes: string | null
  visibility: Visibility
  patron: Patron
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type SystemConnection = {
  id: string
  fromSystemId: string
  toSystemId: string
  /** Whether this system is the origin or the destination of the link. */
  direction: "outbound" | "inbound"
  other: SystemRef | null
  relationshipType: SystemLinkType
  strength: number
  active: boolean
  notes: string | null
  visibility: Visibility
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type SystemRelationships = {
  factions: SystemFactionPresence[]
  npcs: SystemNpcPresence[]
  ships: SystemShipVisit[]
  patrons: SystemPatronOffer[]
  locations: SystemLocation[]
  connections: SystemConnection[]
}

export type SystemHook = {
  id: string
  systemId: string
  title: string
  description: string | null
  used: boolean
  visibility: Visibility
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

/** `date` is normalised ISO; `dateDisplay` preserves stardate input. */
export type SystemLogEntry = {
  id: string
  systemId: string
  date: string
  dateDisplay: string
  event: string
  recordedBy: string | null
  recordedByName: string | null
  createdAt: string
  updatedAt: string
}

export type SystemTimelineEvent = {
  id: string
  systemId: string
  date: string
  dateDisplay: string
  event: string
  visibility: Visibility
  createdBy: string | null
  createdByName: string | null
  createdAt: string
  updatedAt: string
}

export type StarSystem = {
  id: string
  name: string
  description: string | null
  location: string
  techLevel: number
  techLevelName: string | null
  lawLevel: number
  lawLevelName: string | null
  traits: Trait[]
  notes?: string | null
  createdBy: string | null
  createdAt: string
  updatedAt: string
}

export type StarSystemDetail = StarSystem & {
  hooks: SystemHook[]
  interactions: SystemLogEntry[]
  timeline: SystemTimelineEvent[]
  relationships: SystemRelationships
}

export type SystemFilters = {
  search?: string
  tlMin?: number
  tlMax?: number
  lawMin?: number
  lawMax?: number
  location?: string
  traits?: string[]
  travelZone?: string
}

export type SystemInput = {
  name: string
  description?: string | null
  techLevel: number
  lawLevel: number
  location: string
  notes?: string | null
  traitIds?: string[]
}

export type FactionInput = {
  name: string
  type?: FactionType
  description?: string | null
  tier?: number | null
  headquartersSystemId?: string | null
  goals?: string | null
  assets?: string[]
  notes?: string | null
  traitIds?: string[]
}

export type CampaignNpcInput = {
  name: string
  occupation?: string | null
  upp?: string | null
  description?: string | null
  currentLocationSystemId?: string | null
  status?: NpcStatus
  allegianceFactionId?: string | null
  notes?: string | null
  traitIds?: string[]
}

export type ShipInput = {
  name: string
  type?: string | null
  registration?: string | null
  ownerFactionId?: string | null
  ownerNpcId?: string | null
  currentSystemId?: string | null
  status?: ShipStatus
  notes?: string | null
  traitIds?: string[]
}

export type PatronInput = {
  npcId: string
  reputation?: number
  paymentRecord?: PaymentRecord
  jobTypes?: string[]
  riskTolerance?: RiskTolerance
  notes?: string | null
}

export type SystemImportReport = {
  ok: boolean
  created: string[]
  skipped: string[]
  errors: string[]
}

export type ApiResult<T> =
  | { ok: true; data: T; error: null }
  | { ok: false; data: null; error: string }

export type ModuleId =
  | "actions"
  | "conditions"
  | "called-shots"
  | "critical-injuries"
  | "healing"
  | "feats"
  | "skills"
  | "npcs"
  | "traits"
  | "tl"
  | "languages"
  | "lawlevel"
  | "miscellaneous"
  | "equipment"
  | "characters"
  | "systems"
  | "factions"
  | "campaign-npcs"
  | "ships"
  | "patrons"

/** Record count per dataset, or null when that dataset could not be read. */
export type ModuleTelemetry = Record<ModuleId, number | null>

export type DashboardSnapshot = {
  /** Record count per dataset for the status tiles. */
  telemetry: ModuleTelemetry
  /** Actions are reused for the turn-budget summary, so they come back whole. */
  actions: Action[]
}
