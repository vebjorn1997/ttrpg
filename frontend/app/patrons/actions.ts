"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

import { createPatron, deletePatron, updatePatron } from "@/lib/api"
import type { PatronInput } from "@/lib/api-types"
import {
  campaignEnum,
  campaignList,
  campaignText,
  requireGameMaster,
  type FormState,
} from "@/lib/campaign-actions"
import { paymentRecords, riskTolerances } from "@/lib/campaign"

function readInput(
  formData: FormData
): { ok: true; input: PatronInput } | { ok: false; error: string } {
  const npcId = campaignText(formData, "npcId")
  if (!npcId) {
    return { ok: false, error: "Choose which character is offering the work." }
  }

  // Blank means untested rather than notorious, so it settles at zero.
  const reputationRaw = campaignText(formData, "reputation")
  const reputation = reputationRaw === null ? 0 : Number(reputationRaw)
  if (!Number.isInteger(reputation) || reputation < -5 || reputation > 5) {
    return {
      ok: false,
      error: "Reputation must be a whole number from -5 to 5.",
    }
  }

  return {
    ok: true,
    input: {
      npcId,
      reputation,
      paymentRecord: campaignEnum(
        formData,
        "paymentRecord",
        paymentRecords,
        "variable"
      ),
      jobTypes: campaignList(formData, "jobTypes"),
      riskTolerance: campaignEnum(
        formData,
        "riskTolerance",
        riskTolerances,
        "moderate"
      ),
      notes: campaignText(formData, "notes"),
    },
  }
}

export async function createPatronAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await createPatron(parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/patrons")
  redirect(`/patrons/${result.data.id}`)
}

export async function updatePatronAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing patron id.", success: null }

  const parsed = readInput(formData)
  if (!parsed.ok) return { error: parsed.error, success: null }

  const result = await updatePatron(id, parsed.input)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/patrons")
  revalidatePath(`/patrons/${id}`)
  redirect(`/patrons/${id}`)
}

export async function deletePatronAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const denied = await requireGameMaster()
  if (denied) return { error: denied, success: null }

  const id = campaignText(formData, "id")
  if (!id) return { error: "Missing patron id.", success: null }

  const result = await deletePatron(id)
  if (!result.ok) return { error: result.error, success: null }

  revalidatePath("/patrons")
  redirect("/patrons")
}
