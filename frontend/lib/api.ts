/**
 * Server-only client for the Traveller rules API (Hono backend, default :5000).
 *
 * Catalog datasets are public and read-only. Character sheets require a logged-in
 * session; the Next.js server attaches identity headers when calling the API.
 *
 * Client components must import types from `@/lib/api-types` and the base URL
 * from `@/lib/api-config` — never this module.
 */

import "server-only"

import { API_BASE_URL } from "@/lib/api-config"
import type {
  Action,
  ApiResult,
  CalledShot,
  CharacterDetail,
  CharacterSummary,
  Condition,
  CreateCharacterInput,
  CriticalInjury,
  DashboardSnapshot,
  Feat,
  Healing,
  Language,
  LawLevel,
  MiscellaneousRule,
  ModuleId,
  ModuleTelemetry,
  Npc,
  Skill,
  TechLevel,
  Trait,
  UpdateCharacterInput,
} from "@/lib/api-types"
import { getCurrentUser } from "@/lib/session"

export { API_BASE_URL } from "@/lib/api-config"
export type * from "@/lib/api-types"

const REQUEST_TIMEOUT_MS = 6_000

function describeFailure(cause: unknown): string {
  if (cause instanceof DOMException && cause.name === "TimeoutError") {
    return `Request to ${API_BASE_URL} timed out after ${REQUEST_TIMEOUT_MS / 1000}s.`
  }
  if (cause instanceof Error) {
    return cause.message
  }
  return "Unknown transport failure."
}

async function characterAuthHeaders(): Promise<
  | { ok: true; headers: Record<string, string> }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, error: "You must be signed in." }
  }

  const key = process.env.INTERNAL_API_KEY
  if (!key) {
    return { ok: false, error: "INTERNAL_API_KEY is not configured." }
  }

  return {
    ok: true,
    headers: {
      accept: "application/json",
      "x-internal-key": key,
      "x-user-id": user.id,
      "x-user-role": user.role,
    },
  }
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

async function getAuthedCollection<T>(path: string): Promise<ApiResult<T[]>> {
  const auth = await characterAuthHeaders()
  if (!auth.ok) {
    return { ok: false, data: null, error: auth.error }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: auth.headers,
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
export const getMiscellaneous = () =>
  getCollection<MiscellaneousRule>("/miscellaneous")
export const getCharacters = () =>
  getAuthedCollection<CharacterSummary>("/characters")

export async function getCharacter(
  id: string
): Promise<ApiResult<CharacterDetail>> {
  const auth = await characterAuthHeaders()
  if (!auth.ok) {
    return { ok: false, data: null, error: auth.error }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      headers: auth.headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (response.status === 404) {
      return { ok: false, data: null, error: "Character not found." }
    }

    if (response.status === 403) {
      return {
        ok: false,
        data: null,
        error: "You do not have access to this character.",
      }
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
  const auth = await characterAuthHeaders()
  if (!auth.ok) {
    return { ok: false, data: null, error: auth.error }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/characters`, {
      method: "POST",
      headers: {
        ...auth.headers,
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
  const auth = await characterAuthHeaders()
  if (!auth.ok) {
    return { ok: false, data: null, error: auth.error }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      method: "PATCH",
      headers: {
        ...auth.headers,
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

    if (response.status === 403) {
      return {
        ok: false,
        data: null,
        error: "You do not have access to this character.",
      }
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
  const auth = await characterAuthHeaders()
  if (!auth.ok) {
    return { ok: false, data: null, error: auth.error }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/characters/${id}`, {
      method: "DELETE",
      headers: auth.headers,
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
    miscellaneous: getMiscellaneous,
    characters: getCharacters,
  }

/**
 * Reads every dataset in parallel for the dashboard: one pass produces both
 * the per-endpoint record counts and the action list, so nothing is fetched
 * twice while rendering the landing page.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const user = await getCurrentUser()
  const ids = Object.keys(collectionLoaders) as ModuleId[]

  const results = await Promise.all(
    ids.map(async (id) => {
      if (id === "characters" && !user) {
        return { ok: true as const, data: [], error: null }
      }
      if (id === "npcs" && user?.role !== "admin") {
        return { ok: true as const, data: [], error: null }
      }
      return collectionLoaders[id]()
    })
  )

  const telemetry = ids.reduce((counts, id, index) => {
    const result = results[index]
    // Hide gated datasets from telemetry when the viewer cannot access them.
    if (id === "characters" && !user) {
      counts[id] = null
      return counts
    }
    if (id === "npcs" && user?.role !== "admin") {
      counts[id] = null
      return counts
    }
    counts[id] = result.ok ? result.data.length : null
    return counts
  }, {} as ModuleTelemetry)

  const actionsResult = results[ids.indexOf("actions")]

  return {
    telemetry,
    actions: actionsResult.ok ? (actionsResult.data as Action[]) : [],
  }
}
