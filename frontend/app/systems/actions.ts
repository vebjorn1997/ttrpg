"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import {
  createSystem,
  createSystemConnection,
  createSystemFaction,
  createSystemHook,
  createSystemLocation,
  createSystemLogEntry,
  createSystemNpc,
  createSystemPatron,
  createSystemShip,
  createSystemTimelineEvent,
  deleteSystem,
  deleteSystemConnection,
  deleteSystemFaction,
  deleteSystemHook,
  deleteSystemLocation,
  deleteSystemLogEntry,
  deleteSystemNpc,
  deleteSystemPatron,
  deleteSystemShip,
  deleteSystemTimelineEvent,
  importSystems,
  updateSystem,
  updateSystemHook,
  updateSystemLogEntry,
  updateSystemTimelineEvent,
} from "@/lib/api"
import type { SystemInput } from "@/lib/api-types"
import type { FormState, ImportState, RelationshipKind } from "@/lib/campaign"
import {
  campaignCheckbox as checkbox,
  campaignInteger as integer,
  campaignText as text,
  campaignTraitIds as traitIds,
  campaignVisibility as visibility,
  requireGameMaster,
} from "@/lib/campaign-actions"
import { getCurrentUser } from "@/lib/session"

function refreshSystem(systemId: string) {
  revalidatePath("/systems")
  revalidatePath("/systems/map")
  revalidatePath(`/systems/${systemId}`)
}

/* -------------------------------------------------------------------------- */
/* Systems                                                                    */
/* -------------------------------------------------------------------------- */

type ParsedSystem =
  | { ok: true; input: SystemInput }
  | { ok: false; error: string }

function readSystemInput(formData: FormData): ParsedSystem {
  const name = text(formData, "name")
  if (!name) return { ok: false, error: "Name is required." }

  const location = text(formData, "location")
  if (!location) return { ok: false, error: "Hex location is required." }

  const techLevel = integer(formData, "techLevel")
  if (techLevel === null || techLevel < 0 || techLevel > 9) {
    return { ok: false, error: "Tech level must be a whole number from 0 to 9." }
  }

  const lawLevel = integer(formData, "lawLevel")
  if (lawLevel === null || lawLevel < 0 || lawLevel > 4) {
    return { ok: false, error: "Law level must be a whole number from 0 to 4." }
  }

  return {
    ok: true,
    input: {
      name,
      description: text(formData, "description"),
      techLevel,
      lawLevel,
      location: location.toUpperCase(),
      notes: text(formData, "notes"),
      traitIds: traitIds(formData),
    },
  }
}

export async function createSystemAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const parsed = readSystemInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await createSystem(parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/systems")
  revalidatePath("/systems/map")
  redirect(`/systems/${result.data.id}`)
}

export async function updateSystemAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = text(formData, "id")
  if (!id) return { error: "Missing system id.", success: null }

  const parsed = readSystemInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await updateSystem(id, parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(id)
  redirect(`/systems/${id}`)
}

export async function deleteSystemAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = text(formData, "id")
  if (!id) return { error: "Missing system id.", success: null }

  const result = await deleteSystem(id)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/systems")
  revalidatePath("/systems/map")
  redirect("/systems")
}

export async function importSystemsAction(
  _prev: ImportState,
  formData: FormData
): Promise<ImportState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null, report: null }

  const file = formData.get("file")
  const pasted = text(formData, "csv")

  const csv =
    file instanceof File && file.size > 0 ? await file.text() : (pasted ?? "")

  if (csv.trim() === "") {
    return { error: "Choose a CSV file or paste CSV text.", success: null, report: null }
  }

  const result = await importSystems(csv)
  if (!result.ok) return { error: result.error, success: null, report: null }

  revalidatePath("/systems")
  revalidatePath("/systems/map")

  const { created, skipped, errors } = result.data
  return {
    error: errors.length ? `${errors.length} row(s) could not be imported.` : null,
    success: `Imported ${created.length} system(s); skipped ${skipped.length} already on file.`,
    report: result.data,
  }
}

/* -------------------------------------------------------------------------- */
/* Adventure hooks                                                            */
/* -------------------------------------------------------------------------- */

export async function addHookAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const title = text(formData, "title")
  if (!systemId) return { error: "Missing system id.", success: null }
  if (!title) return { error: "Hook title is required.", success: null }

  const result = await createSystemHook(systemId, {
    title,
    description: text(formData, "description"),
    visibility: visibility(formData),
  })
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Hook filed." }
}

export async function setHookUsedAction(
  systemId: string,
  hookId: string,
  used: boolean
): Promise<{ error: string | null }> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied }

  const result = await updateSystemHook(systemId, hookId, { used })
  if (!result.ok) return { error: result.error }

  refreshSystem(systemId)
  return { error: null }
}

export async function deleteHookAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const hookId = text(formData, "hookId")
  if (!systemId || !hookId) return { error: "Missing hook id.", success: null }

  const result = await deleteSystemHook(systemId, hookId)
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Hook removed." }
}

/* -------------------------------------------------------------------------- */
/* Traveller log — any signed-in player may file and edit their own entries    */
/* -------------------------------------------------------------------------- */

export async function addLogEntryAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in.", success: null }

  const systemId = text(formData, "systemId")
  const date = text(formData, "date")
  const event = text(formData, "event")
  if (!systemId) return { error: "Missing system id.", success: null }
  if (!date) return { error: "A date is required, e.g. 1105-02-20 or 1105-045.", success: null }
  if (!event) return { error: "Describe what happened.", success: null }

  const result = await createSystemLogEntry(systemId, { date, event })
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Log entry filed." }
}

export async function updateLogEntryAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in.", success: null }

  const systemId = text(formData, "systemId")
  const entryId = text(formData, "entryId")
  const date = text(formData, "date")
  const event = text(formData, "event")
  if (!systemId || !entryId) return { error: "Missing log entry id.", success: null }
  if (!date) return { error: "A date is required.", success: null }
  if (!event) return { error: "Describe what happened.", success: null }

  const result = await updateSystemLogEntry(systemId, entryId, { date, event })
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Log entry updated." }
}

export async function deleteLogEntryAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) return { error: "You must be signed in.", success: null }

  const systemId = text(formData, "systemId")
  const entryId = text(formData, "entryId")
  if (!systemId || !entryId) return { error: "Missing log entry id.", success: null }

  const result = await deleteSystemLogEntry(systemId, entryId)
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Log entry removed." }
}

/* -------------------------------------------------------------------------- */
/* Timeline history                                                           */
/* -------------------------------------------------------------------------- */

export async function addTimelineEventAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const date = text(formData, "date")
  const event = text(formData, "event")
  if (!systemId) return { error: "Missing system id.", success: null }
  if (!date) return { error: "A date is required.", success: null }
  if (!event) return { error: "Describe the event.", success: null }

  const result = await createSystemTimelineEvent(systemId, {
    date,
    event,
    visibility: visibility(formData),
  })
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "History event recorded." }
}

export async function updateTimelineEventAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const eventId = text(formData, "eventId")
  const date = text(formData, "date")
  const event = text(formData, "event")
  if (!systemId || !eventId) return { error: "Missing history event id.", success: null }
  if (!date) return { error: "A date is required.", success: null }
  if (!event) return { error: "Describe the event.", success: null }

  const result = await updateSystemTimelineEvent(systemId, eventId, {
    date,
    event,
    visibility: visibility(formData),
  })
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "History event updated." }
}

export async function deleteTimelineEventAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const eventId = text(formData, "eventId")
  if (!systemId || !eventId) return { error: "Missing history event id.", success: null }

  const result = await deleteSystemTimelineEvent(systemId, eventId)
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "History event removed." }
}

/* -------------------------------------------------------------------------- */
/* Relationships                                                              */
/* -------------------------------------------------------------------------- */

function relationshipBody(kind: RelationshipKind, formData: FormData): unknown {
  switch (kind) {
    case "faction":
      return {
        factionId: text(formData, "factionId"),
        presenceType: text(formData, "presenceType"),
        influence: integer(formData, "influence") ?? 3,
        relationshipToParty: text(formData, "relationshipToParty") ?? "neutral",
        notes: text(formData, "notes"),
        visibility: visibility(formData),
      }
    case "npc":
      return {
        npcId: text(formData, "npcId"),
        connectionType: text(formData, "connectionType"),
        currentStatus: text(formData, "currentStatus"),
        arrivalDate: text(formData, "arrivalDate"),
        departureDate: text(formData, "departureDate"),
        notes: text(formData, "notes"),
        visibility: visibility(formData),
      }
    case "ship":
      return {
        shipId: text(formData, "shipId"),
        dockedAtLocationId: text(formData, "dockedAtLocationId"),
        arrivalDate: text(formData, "arrivalDate"),
        departureDate: text(formData, "departureDate"),
        purpose: text(formData, "purpose"),
        status: text(formData, "status") ?? "docked",
        notes: text(formData, "notes"),
        visibility: visibility(formData),
      }
    case "patron":
      return {
        patronId: text(formData, "patronId"),
        availability: text(formData, "availability") ?? "available",
        jobSummary: text(formData, "jobSummary"),
        reward: text(formData, "reward"),
        difficulty: text(formData, "difficulty"),
        legalStatus: text(formData, "legalStatus"),
        notes: text(formData, "notes"),
        visibility: visibility(formData),
      }
    case "location":
      return {
        name: text(formData, "name"),
        type: text(formData, "type") ?? "other",
        description: text(formData, "description"),
        securityLevel: integer(formData, "securityLevel"),
        notes: text(formData, "notes"),
        traitIds: traitIds(formData),
      }
    case "connection":
      return {
        toSystemId: text(formData, "toSystemId"),
        relationshipType: text(formData, "relationshipType"),
        strength: integer(formData, "strength") ?? 2,
        active: checkbox(formData, "active"),
        notes: text(formData, "notes"),
        visibility: visibility(formData),
      }
  }
}

const creators = {
  faction: createSystemFaction,
  npc: createSystemNpc,
  ship: createSystemShip,
  patron: createSystemPatron,
  location: createSystemLocation,
  connection: createSystemConnection,
} as const

const removers = {
  faction: deleteSystemFaction,
  npc: deleteSystemNpc,
  ship: deleteSystemShip,
  patron: deleteSystemPatron,
  location: deleteSystemLocation,
  connection: deleteSystemConnection,
} as const

function isRelationshipKind(value: unknown): value is RelationshipKind {
  return (
    typeof value === "string" &&
    ["faction", "npc", "ship", "patron", "location", "connection"].includes(value)
  )
}

export async function addRelationshipAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const kind = formData.get("kind")
  if (!systemId) return { error: "Missing system id.", success: null }
  if (!isRelationshipKind(kind)) {
    return { error: "Pick what kind of relationship to add.", success: null }
  }

  const result = await creators[kind](systemId, relationshipBody(kind, formData))
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Relationship saved." }
}

export async function deleteRelationshipAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const systemId = text(formData, "systemId")
  const recordId = text(formData, "recordId")
  const kind = formData.get("kind")
  if (!systemId || !recordId) return { error: "Missing record id.", success: null }
  if (!isRelationshipKind(kind)) return { error: "Unknown relationship type.", success: null }

  const result = await removers[kind](systemId, recordId)
  if (!result.ok) return { error: result.error, success: null }

  refreshSystem(systemId)
  return { error: null, success: "Relationship removed." }
}
