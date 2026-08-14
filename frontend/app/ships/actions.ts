"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createShip, deleteShip, updateShip } from "@/lib/api"
import type { ShipInput } from "@/lib/api-types"
import {
  campaignEnum,
  campaignText,
  campaignTraitIds,
  requireGameMaster,
  type FormState,
} from "@/lib/campaign-actions"
import { shipStatuses } from "@/lib/campaign"

function readInput(
  formData: FormData
): { ok: true; input: ShipInput } | { ok: false; error: string } {
  const name = campaignText(formData, "name")
  if (!name) return { ok: false, error: "Name is required." }

  const ownerFactionId = campaignText(formData, "ownerFactionId")
  const ownerNpcId = campaignText(formData, "ownerNpcId")
  if (ownerFactionId && ownerNpcId) {
    return {
      ok: false,
      error: "A ship can be owned by a faction or a person, not both.",
    }
  }

  return {
    ok: true,
    input: {
      name,
      type: campaignText(formData, "type"),
      registration: campaignText(formData, "registration"),
      ownerFactionId,
      ownerNpcId,
      currentSystemId: campaignText(formData, "currentSystemId"),
      status: campaignEnum(formData, "status", shipStatuses, "active"),
      notes: campaignText(formData, "notes"),
      traitIds: campaignTraitIds(formData),
    },
  }
}

export async function createShipAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await createShip(parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/ships")
  redirect(`/ships/${result.data.id}`)
}

export async function updateShipAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing ship id.", success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await updateShip(id, parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/ships")
  revalidatePath(`/ships/${id}`)
  redirect(`/ships/${id}`)
}

export async function deleteShipAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing ship id.", success: null }

  const result = await deleteShip(id)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/ships")
  redirect("/ships")
}
