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
  credits: number
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
  | "characters"

/** Record count per dataset, or null when that dataset could not be read. */
export type ModuleTelemetry = Record<ModuleId, number | null>

export type DashboardSnapshot = {
  /** Record count per dataset for the status tiles. */
  telemetry: ModuleTelemetry
  /** Actions are reused for the turn-budget summary, so they come back whole. */
  actions: Action[]
}
