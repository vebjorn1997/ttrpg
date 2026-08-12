/**
 * Client for the Traveller rules API (Hono backend, default :5000).
 *
 * Catalog datasets are public and read-only. Character sheets support create
 * and delete via server actions. Fetches run on the server so the browser does
 * not need direct API access; a missing backend degrades to an on-screen notice.
 */

import type { FeatRequirement } from "@/lib/feat-requirements"

export const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5000"
).replace(/\/+$/, "")

const REQUEST_TIMEOUT_MS = 6_000

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
}

export type CharacterSummary = {
  id: string
  name: string
  playerName: string | null
  str: CharacteristicPair
  dex: CharacteristicPair
  end: CharacteristicPair
  armorTotal: number
}

export type CharacterDetail = {
  id: string
  name: string
  playerName: string | null
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

function describeFailure(cause: unknown): string {
  if (cause instanceof DOMException && cause.name === "TimeoutError") {
    return `Request to ${API_BASE_URL} timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
  }
  if (cause instanceof Error) {
    return cause.message
  }
  return "Unknown transport failure."
}

async function getCollection<T>(path: string): Promise<ApiResult<T[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { accept: "application/json" },
      // Always read through to the API; this is a live reference tool.
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `${path} responded ${response.status} ${response.statusText}.`,
      }
    }

    const payload: unknown = await response.json()

    if (!Array.isArray(payload)) {
      return {
        ok: false,
        data: null,
        error: `${path} returned ${typeof payload}, expected an array.`,
      }
    }

    return { ok: true, data: payload as T[], error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

export const getActions = () => getCollection<Action>("/actions")
export const getConditions = () => getCollection<Condition>("/conditions")
export const getCalledShots = () => getCollection<CalledShot>("/called-shots")
export const getCriticalInjuries = () =>
  getCollection<CriticalInjury>("/critical-injury")
export const getHealing = () => getCollection<Healing>("/healing")
export const getFeats = () => getCollection<Feat>("/feats")
export const getSkills = () => getCollection<Skill>("/skills")
export const getNpcs = () => getCollection<Npc>("/npc-catalog")
export const getTraits = () => getCollection<Trait>("/traits")
export const getTechLevels = () => getCollection<TechLevel>("/tl")
export const getLanguages = () => getCollection<Language>("/languages")
export const getLawLevels = () => getCollection<LawLevel>("/lawlevel")
export const getCharacters = () => getCollection<CharacterSummary>("/characters")

export async function getCharacter(
  id: string
): Promise<ApiResult<CharacterDetail>> {
  try {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (response.status === 404) {
      return { ok: false, data: null, error: "Character not found." }
    }

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `/characters/${id} responded ${response.status} ${response.statusText}.`,
      }
    }

    const payload: unknown = await response.json()
    return { ok: true, data: payload as CharacterDetail, error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

export async function createCharacter(
  input: CreateCharacterInput
): Promise<ApiResult<CharacterDetail>> {
  try {
    const response = await fetch(`${API_BASE_URL}/characters`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify(input),
    })

    const payload: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : `/characters responded ${response.status} ${response.statusText}.`
      return { ok: false, data: null, error: message }
    }

    return { ok: true, data: payload as CharacterDetail, error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

export async function updateCharacter(
  id: string,
  input: UpdateCharacterInput
): Promise<ApiResult<CharacterDetail>> {
  try {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      method: "PATCH",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body: JSON.stringify(input),
    })

    const payload: unknown = await response.json().catch(() => null)

    if (response.status === 404) {
      return { ok: false, data: null, error: "Character not found." }
    }

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : `/characters/${id} responded ${response.status} ${response.statusText}.`
      return { ok: false, data: null, error: message }
    }

    return { ok: true, data: payload as CharacterDetail, error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

export async function deleteCharacter(
  id: string
): Promise<ApiResult<{ ok: true; id: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      method: "DELETE",
      headers: { accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    const payload: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      const message =
        payload &&
        typeof payload === "object" &&
        "error" in payload &&
        typeof (payload as { error: unknown }).error === "string"
          ? (payload as { error: string }).error
          : `/characters/${id} responded ${response.status} ${response.statusText}.`
      return { ok: false, data: null, error: message }
    }

    return {
      ok: true,
      data: payload as { ok: true; id: string },
      error: null,
    }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

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

const collectionLoaders: Record<ModuleId, () => Promise<ApiResult<unknown[]>>> =
  {
    actions: getActions,
    conditions: getConditions,
    "called-shots": getCalledShots,
    "critical-injuries": getCriticalInjuries,
    healing: getHealing,
    feats: getFeats,
    skills: getSkills,
    npcs: getNpcs,
    traits: getTraits,
    tl: getTechLevels,
    languages: getLanguages,
    lawlevel: getLawLevels,
    characters: getCharacters,
  }

export type DashboardSnapshot = {
  /** Record count per dataset for the status tiles. */
  telemetry: ModuleTelemetry
  /** Actions are reused for the turn-budget summary, so they come back whole. */
  actions: Action[]
}

/**
 * Reads every dataset in parallel for the dashboard: one pass produces both
 * the per-endpoint record counts and the action list, so nothing is fetched
 * twice while rendering the landing page.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const ids = Object.keys(collectionLoaders) as ModuleId[]
  const results = await Promise.all(ids.map((id) => collectionLoaders[id]()))

  const telemetry = ids.reduce((counts, id, index) => {
    const result = results[index]
    counts[id] = result.ok ? result.data.length : null
    return counts
  }, {} as ModuleTelemetry)

  const actionsResult = results[ids.indexOf("actions")]

  return {
    telemetry,
    actions: actionsResult.ok ? (actionsResult.data as Action[]) : [],
  }
}
