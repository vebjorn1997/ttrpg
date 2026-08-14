"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import {
  createCampaignNpc,
  deleteCampaignNpc,
  updateCampaignNpc,
} from "@/lib/api"
import type { CampaignNpcInput } from "@/lib/api-types"
import {
  campaignEnum,
  campaignText,
  campaignTraitIds,
  requireGameMaster,
  type FormState,
} from "@/lib/campaign-actions"
import { npcStatuses } from "@/lib/campaign"

const UPP_PATTERN = /^[0-9A-Fa-f]{6}$/

function readInput(
  formData: FormData
): { ok: true; input: CampaignNpcInput } | { ok: false; error: string } {
  const name = campaignText(formData, "name")
  if (!name) return { ok: false, error: "Name is required." }

  const upp = campaignText(formData, "upp")
  if (upp !== null && !UPP_PATTERN.test(upp)) {
    return { ok: false, error: "UPP must be six hex digits, e.g. 7A6B94." }
  }

  return {
    ok: true,
    input: {
      name,
      occupation: campaignText(formData, "occupation"),
      upp: upp === null ? null : upp.toUpperCase(),
      description: campaignText(formData, "description"),
      currentLocationSystemId: campaignText(formData, "currentLocationSystemId"),
      status: campaignEnum(formData, "status", npcStatuses, "alive"),
      allegianceFactionId: campaignText(formData, "allegianceFactionId"),
      notes: campaignText(formData, "notes"),
      traitIds: campaignTraitIds(formData),
    },
  }
}

export async function createCampaignNpcAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await createCampaignNpc(parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/campaign-npcs")
  redirect(`/campaign-npcs/${result.data.id}`)
}

export async function updateCampaignNpcAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing character id.", success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await updateCampaignNpc(id, parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/campaign-npcs")
  revalidatePath(`/campaign-npcs/${id}`)
  redirect(`/campaign-npcs/${id}`)
}

export async function deleteCampaignNpcAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing character id.", success: null }

  const result = await deleteCampaignNpc(id)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/campaign-npcs")
  redirect("/campaign-npcs")
}
