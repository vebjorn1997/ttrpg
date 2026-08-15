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

import { cache } from "react"

import { API_BASE_URL } from "@/lib/api-config"
import type {
  Action,
  ApiResult,
  CalledShot,
  CampaignNpc,
  CampaignNpcDetail,
  CampaignNpcInput,
  CharacterDetail,
  CharacterSummary,
  Condition,
  CreateCharacterInput,
  CriticalInjury,
  DashboardSnapshot,
  Equipment,
  Faction,
  FactionDetail,
  FactionInput,
  Feat,
  Healing,
  Language,
  LawLevel,
  MiscellaneousRule,
  ModuleId,
  ModuleTelemetry,
  Npc,
  Patron,
  PatronDetail,
  PatronInput,
  Ship,
  ShipDetail,
  ShipInput,
  Skill,
  StarSystem,
  StarSystemDetail,
  SystemConnection,
  SystemFactionPresence,
  SystemFilters,
  SystemHook,
  SystemImportReport,
  SystemLocation,
  SystemLogEntry,
  SystemNpcPresence,
  SystemPatronOffer,
  SystemRelationships,
  SystemShipVisit,
  SystemTimelineEvent,
  SystemInput,
  TechLevel,
  Trait,
  UpdateCharacterInput,
  Visibility,
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

const getCollection = cache(async function getCollection<T>(
  path: string
): Promise<ApiResult<T[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { accept: "application/json" },
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
})

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
export const getEquipment = () => getCollection<Equipment>("/equipment")
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

export async function setCharacterEquippedArmor(
  id: string,
  equipmentId: string,
  equipped: boolean
): Promise<ApiResult<CharacterDetail>> {
  const auth = await characterAuthHeaders()
  if (!auth.ok) {
    return { ok: false, data: null, error: auth.error }
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/characters/${id}/equipped-armor`,
      {
        method: "PUT",
        headers: {
          ...auth.headers,
          "content-type": "application/json",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        body: JSON.stringify({ equipmentId, equipped }),
      }
    )

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
          : `/characters/${id}/equipped-armor responded ${response.status} ${response.statusText}.`
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

/* -------------------------------------------------------------------------- */
/* Campaign world: systems & relationships                                    */
/* -------------------------------------------------------------------------- */

/**
 * The systems database is readable signed-out, so identity headers are attached
 * opportunistically. Without them the API answers as the `visitor` tier and
 * withholds every `gm_only` record.
 */
async function viewerHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { accept: "application/json" }

  const user = await getCurrentUser()
  const key = process.env.INTERNAL_API_KEY
  if (user && key) {
    headers["x-internal-key"] = key
    headers["x-user-id"] = user.id
    headers["x-user-role"] = user.role
  }

  return headers
}

function errorFrom(payload: unknown, fallback: string): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error
  }
  return fallback
}

async function campaignRequest<T>(
  path: string,
  init: { method?: string; body?: unknown; rawBody?: string } = {}
): Promise<ApiResult<T>> {
  const headers = await viewerHeaders()
  if (init.body !== undefined) headers["content-type"] = "application/json"
  if (init.rawBody !== undefined) headers["content-type"] = "text/csv"

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      body:
        init.rawBody !== undefined
          ? init.rawBody
          : init.body === undefined
            ? undefined
            : JSON.stringify(init.body),
    })

    const payload: unknown = await response.json().catch(() => null)

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: errorFrom(
          payload,
          `${path} responded ${response.status} ${response.statusText}.`
        ),
      }
    }

    return { ok: true, data: payload as T, error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

function systemQuery(filters: SystemFilters = {}): string {
  const params = new URLSearchParams()
  if (filters.search) params.set("search", filters.search)
  if (filters.tlMin !== undefined) params.set("tl_min", String(filters.tlMin))
  if (filters.tlMax !== undefined) params.set("tl_max", String(filters.tlMax))
  if (filters.lawMin !== undefined) params.set("law_min", String(filters.lawMin))
  if (filters.lawMax !== undefined) params.set("law_max", String(filters.lawMax))
  if (filters.location) params.set("location", filters.location)
  if (filters.travelZone) params.set("travel_zone", filters.travelZone)
  for (const trait of filters.traits ?? []) params.append("trait", trait)

  const query = params.toString()
  return query ? `?${query}` : ""
}

export const getSystems = (filters?: SystemFilters) =>
  campaignRequest<StarSystem[]>(`/systems${systemQuery(filters)}`)

export const getSystem = (id: string) =>
  campaignRequest<StarSystemDetail>(`/systems/${id}`)

export const createSystem = (input: SystemInput) =>
  campaignRequest<StarSystemDetail>("/systems", { method: "POST", body: input })

export const updateSystem = (id: string, input: SystemInput) =>
  campaignRequest<StarSystemDetail>(`/systems/${id}`, { method: "PUT", body: input })

export const deleteSystem = (id: string) =>
  campaignRequest<{ ok: true; id: string }>(`/systems/${id}`, { method: "DELETE" })

export const exportSystem = (id: string) =>
  campaignRequest<unknown>(`/systems/${id}/export`)

export const exportSystems = () => campaignRequest<unknown>("/systems/export")

export const importSystems = (csv: string) =>
  campaignRequest<SystemImportReport>("/systems/import", {
    method: "POST",
    body: { csv },
  })

export const getSystemRelationships = (id: string) =>
  campaignRequest<SystemRelationships>(`/systems/${id}/relationships`)

/* Adventure hooks */

export const createSystemHook = (
  systemId: string,
  input: { title: string; description?: string | null; visibility?: Visibility }
) =>
  campaignRequest<SystemHook[]>(`/systems/${systemId}/hooks`, {
    method: "POST",
    body: input,
  })

export const updateSystemHook = (
  systemId: string,
  hookId: string,
  input: {
    title?: string
    description?: string | null
    used?: boolean
    visibility?: Visibility
  }
) =>
  campaignRequest<SystemHook[]>(`/systems/${systemId}/hooks/${hookId}`, {
    method: "PUT",
    body: input,
  })

export const deleteSystemHook = (systemId: string, hookId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/hooks/${hookId}`,
    { method: "DELETE" }
  )

/* Traveller log */

export const createSystemLogEntry = (
  systemId: string,
  input: { date: string; event: string }
) =>
  campaignRequest<SystemLogEntry[]>(`/systems/${systemId}/interactions`, {
    method: "POST",
    body: input,
  })

export const updateSystemLogEntry = (
  systemId: string,
  entryId: string,
  input: { date?: string; event?: string }
) =>
  campaignRequest<SystemLogEntry[]>(
    `/systems/${systemId}/interactions/${entryId}`,
    { method: "PUT", body: input }
  )

export const deleteSystemLogEntry = (systemId: string, entryId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/interactions/${entryId}`,
    { method: "DELETE" }
  )

/* Timeline history */

export const createSystemTimelineEvent = (
  systemId: string,
  input: { date: string; event: string; visibility?: Visibility }
) =>
  campaignRequest<SystemTimelineEvent[]>(`/systems/${systemId}/timeline`, {
    method: "POST",
    body: input,
  })

export const updateSystemTimelineEvent = (
  systemId: string,
  eventId: string,
  input: { date?: string; event?: string; visibility?: Visibility }
) =>
  campaignRequest<SystemTimelineEvent[]>(
    `/systems/${systemId}/timeline/${eventId}`,
    { method: "PUT", body: input }
  )

export const deleteSystemTimelineEvent = (systemId: string, eventId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/timeline/${eventId}`,
    { method: "DELETE" }
  )

/* Relationship junctions */

export const createSystemFaction = (systemId: string, input: unknown) =>
  campaignRequest<SystemFactionPresence[]>(`/systems/${systemId}/factions`, {
    method: "POST",
    body: input,
  })

export const updateSystemFaction = (
  systemId: string,
  presenceId: string,
  input: unknown
) =>
  campaignRequest<SystemFactionPresence[]>(
    `/systems/${systemId}/factions/${presenceId}`,
    { method: "PUT", body: input }
  )

export const deleteSystemFaction = (systemId: string, presenceId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/factions/${presenceId}`,
    { method: "DELETE" }
  )

export const createSystemNpc = (systemId: string, input: unknown) =>
  campaignRequest<SystemNpcPresence[]>(`/systems/${systemId}/npcs`, {
    method: "POST",
    body: input,
  })

export const updateSystemNpc = (
  systemId: string,
  presenceId: string,
  input: unknown
) =>
  campaignRequest<SystemNpcPresence[]>(`/systems/${systemId}/npcs/${presenceId}`, {
    method: "PUT",
    body: input,
  })

export const deleteSystemNpc = (systemId: string, presenceId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/npcs/${presenceId}`,
    { method: "DELETE" }
  )

export const createSystemShip = (systemId: string, input: unknown) =>
  campaignRequest<SystemShipVisit[]>(`/systems/${systemId}/ships`, {
    method: "POST",
    body: input,
  })

export const updateSystemShip = (
  systemId: string,
  presenceId: string,
  input: unknown
) =>
  campaignRequest<SystemShipVisit[]>(`/systems/${systemId}/ships/${presenceId}`, {
    method: "PUT",
    body: input,
  })

export const deleteSystemShip = (systemId: string, presenceId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/ships/${presenceId}`,
    { method: "DELETE" }
  )

export const createSystemPatron = (systemId: string, input: unknown) =>
  campaignRequest<SystemPatronOffer[]>(`/systems/${systemId}/patrons`, {
    method: "POST",
    body: input,
  })

export const updateSystemPatron = (
  systemId: string,
  presenceId: string,
  input: unknown
) =>
  campaignRequest<SystemPatronOffer[]>(
    `/systems/${systemId}/patrons/${presenceId}`,
    { method: "PUT", body: input }
  )

export const deleteSystemPatron = (systemId: string, presenceId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/patrons/${presenceId}`,
    { method: "DELETE" }
  )

export const createSystemLocation = (systemId: string, input: unknown) =>
  campaignRequest<SystemLocation[]>(`/systems/${systemId}/locations`, {
    method: "POST",
    body: input,
  })

export const updateSystemLocation = (
  systemId: string,
  locationId: string,
  input: unknown
) =>
  campaignRequest<SystemLocation[]>(
    `/systems/${systemId}/locations/${locationId}`,
    { method: "PUT", body: input }
  )

export const deleteSystemLocation = (systemId: string, locationId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/locations/${locationId}`,
    { method: "DELETE" }
  )

export const createSystemConnection = (systemId: string, input: unknown) =>
  campaignRequest<SystemConnection[]>(`/systems/${systemId}/connections`, {
    method: "POST",
    body: input,
  })

export const updateSystemConnection = (
  systemId: string,
  connectionId: string,
  input: unknown
) =>
  campaignRequest<SystemConnection[]>(
    `/systems/${systemId}/connections/${connectionId}`,
    { method: "PUT", body: input }
  )

export const deleteSystemConnection = (systemId: string, connectionId: string) =>
  campaignRequest<{ ok: true; id: string }>(
    `/systems/${systemId}/connections/${connectionId}`,
    { method: "DELETE" }
  )

/* Standalone entities */

export const getFactions = (search?: string) =>
  campaignRequest<Faction[]>(
    `/factions${search ? `?search=${encodeURIComponent(search)}` : ""}`
  )

export const getFaction = (id: string) =>
  campaignRequest<FactionDetail>(`/factions/${id}`)

export const createFaction = (input: FactionInput) =>
  campaignRequest<FactionDetail>("/factions", { method: "POST", body: input })

export const updateFaction = (id: string, input: FactionInput) =>
  campaignRequest<FactionDetail>(`/factions/${id}`, { method: "PUT", body: input })

export const deleteFaction = (id: string) =>
  campaignRequest<{ ok: true; id: string }>(`/factions/${id}`, { method: "DELETE" })

export const getCampaignNpcs = (search?: string) =>
  campaignRequest<CampaignNpc[]>(
    `/campaign-npcs${search ? `?search=${encodeURIComponent(search)}` : ""}`
  )

export const getCampaignNpc = (id: string) =>
  campaignRequest<CampaignNpcDetail>(`/campaign-npcs/${id}`)

export const createCampaignNpc = (input: CampaignNpcInput) =>
  campaignRequest<CampaignNpcDetail>("/campaign-npcs", {
    method: "POST",
    body: input,
  })

export const updateCampaignNpc = (id: string, input: CampaignNpcInput) =>
  campaignRequest<CampaignNpcDetail>(`/campaign-npcs/${id}`, {
    method: "PUT",
    body: input,
  })

export const deleteCampaignNpc = (id: string) =>
  campaignRequest<{ ok: true; id: string }>(`/campaign-npcs/${id}`, {
    method: "DELETE",
  })

export const getShips = (search?: string) =>
  campaignRequest<Ship[]>(
    `/ships${search ? `?search=${encodeURIComponent(search)}` : ""}`
  )

export const getShip = (id: string) => campaignRequest<ShipDetail>(`/ships/${id}`)

export const createShip = (input: ShipInput) =>
  campaignRequest<ShipDetail>("/ships", { method: "POST", body: input })

export const updateShip = (id: string, input: ShipInput) =>
  campaignRequest<ShipDetail>(`/ships/${id}`, { method: "PUT", body: input })

export const deleteShip = (id: string) =>
  campaignRequest<{ ok: true; id: string }>(`/ships/${id}`, { method: "DELETE" })

export const getPatrons = (search?: string) =>
  campaignRequest<Patron[]>(
    `/patrons${search ? `?search=${encodeURIComponent(search)}` : ""}`
  )

export const getPatron = (id: string) =>
  campaignRequest<PatronDetail>(`/patrons/${id}`)

export const createPatron = (input: PatronInput) =>
  campaignRequest<PatronDetail>("/patrons", { method: "POST", body: input })

export const updatePatron = (id: string, input: PatronInput) =>
  campaignRequest<PatronDetail>(`/patrons/${id}`, { method: "PUT", body: input })

export const deletePatron = (id: string) =>
  campaignRequest<{ ok: true; id: string }>(`/patrons/${id}`, { method: "DELETE" })

const MODULE_IDS: ModuleId[] = [
  "actions",
  "conditions",
  "called-shots",
  "critical-injuries",
  "healing",
  "feats",
  "skills",
  "npcs",
  "traits",
  "tl",
  "languages",
  "lawlevel",
  "miscellaneous",
  "equipment",
  "characters",
  "systems",
  "factions",
  "campaign-npcs",
  "ships",
  "patrons",
]

function isCountsPayload(value: unknown): value is Record<string, number> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

export async function getCatalogCounts(): Promise<ApiResult<Record<string, number>>> {
  try {
    const response = await fetch(`${API_BASE_URL}/counts`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `/counts responded ${response.status} ${response.statusText}.`,
      }
    }

    const payload: unknown = await response.json()
    if (!isCountsPayload(payload)) {
      return { ok: false, data: null, error: "/counts returned a non-object payload." }
    }

    return { ok: true, data: payload, error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

export type RuleIndexEntry = {
  module: string
  id: string
  title: string
}

export async function getRuleIndex(): Promise<ApiResult<RuleIndexEntry[]>> {
  try {
    const response = await fetch(`${API_BASE_URL}/rule-index`, {
      headers: { accept: "application/json" },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) {
      return {
        ok: false,
        data: null,
        error: `/rule-index responded ${response.status} ${response.statusText}.`,
      }
    }

    const payload: unknown = await response.json()
    if (!Array.isArray(payload)) {
      return {
        ok: false,
        data: null,
        error: `/rule-index returned ${typeof payload}, expected an array.`,
      }
    }

    return { ok: true, data: payload as RuleIndexEntry[], error: null }
  } catch (cause) {
    return { ok: false, data: null, error: describeFailure(cause) }
  }
}

/**
 * Dashboard only needs row counts plus the actions list for the turn-budget
 * panel. Pulling every collection just to call `.length` was 20 round trips.
 */
export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const user = await getCurrentUser()
  const [countsResult, actions] = await Promise.all([
    getCatalogCounts(),
    getActions(),
  ])

  const telemetry = MODULE_IDS.reduce((counts, id) => {
    if (id === "characters" && !user) {
      counts[id] = null
      return counts
    }
    if (id === "npcs" && user?.role !== "admin") {
      counts[id] = null
      return counts
    }
    const n = countsResult.data?.[id]
    counts[id] = countsResult.ok && typeof n === "number" ? n : null
    return counts
  }, {} as ModuleTelemetry)

  return {
    telemetry,
    actions: actions.data ?? [],
  }
}
