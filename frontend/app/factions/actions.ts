"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createFaction, deleteFaction, updateFaction } from "@/lib/api"
import type { FactionInput } from "@/lib/api-types"
import {
  campaignEnum,
  campaignList,
  campaignText,
  campaignTraitIds,
  requireGameMaster,
  type FormState,
} from "@/lib/campaign-actions"
import { factionTypes } from "@/lib/campaign"

function readInput(
  formData: FormData
): { ok: true; input: FactionInput } | { ok: false; error: string } {
  const name = campaignText(formData, "name")
  if (!name) return { ok: false, error: "Name is required." }

  const type = campaignEnum(formData, "type", factionTypes, "other")

  const tierRaw = campaignText(formData, "tier")
  const tier = tierRaw === null ? null : Number(tierRaw)
  if (tier !== null && (!Number.isInteger(tier) || tier < 1 || tier > 5)) {
    return { ok: false, error: "Tier must be a whole number from 1 to 5." }
  }

  const HEX = /^#[0-9A-Fa-f]{6}$/
  const color = campaignText(formData, "color")
  if (!color || !HEX.test(color)) {
    return { ok: false, error: "Map colour must be a hex code, e.g. #32a852." }
  }

  return {
    ok: true,
    input: {
      name,
      type,
      description: campaignText(formData, "description"),
      tier,
      headquartersSystemId: campaignText(formData, "headquartersSystemId"),
      goals: campaignText(formData, "goals"),
      assets: campaignList(formData, "assets"),
      color: color.toLowerCase(),
      notes: campaignText(formData, "notes"),
      traitIds: campaignTraitIds(formData),
    },
  }
}

export async function createFactionAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await createFaction(parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/factions")
  revalidatePath("/systems")
  revalidatePath("/systems/map")
  redirect(`/factions/${result.data.id}`)
}

export async function updateFactionAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing faction id.", success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await updateFaction(id, parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/factions")
  revalidatePath(`/factions/${id}`)
  revalidatePath("/systems")
  revalidatePath("/systems/map")
  redirect(`/factions/${id}`)
}

export async function deleteFactionAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing faction id.", success: null }

  const result = await deleteFaction(id)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/factions")
  revalidatePath("/systems")
  revalidatePath("/systems/map")
  redirect("/factions")
}
