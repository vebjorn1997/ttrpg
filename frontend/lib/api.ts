/**
 * Read-only client for the Traveller rules API (Hono backend, default :5000).
 *
 * Every dataset is public, so requests carry no credentials. Fetches run in
 * Server Components, which means the browser never needs to reach the API
 * directly and a missing backend degrades to an on-screen notice instead of a
 * crashed page.
 */

export const API_BASE_URL = (
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:5000"
).replace(/\/+$/, "")

const REQUEST_TIMEOUT_MS = 6_000

export type Trait = {
  id: string
  name: string
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
  cost: string
  traits: string[] | null
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
export const getNpcs = () => getCollection<Npc>("/npc-catalog")
export const getTraits = () => getCollection<Trait>("/traits")

export type ModuleId =
  | "actions"
  | "conditions"
  | "called-shots"
  | "critical-injuries"
  | "healing"
  | "feats"
  | "npcs"
  | "traits"

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
    npcs: getNpcs,
    traits: getTraits,
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
