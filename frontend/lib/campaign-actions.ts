import "server-only"

import { getCurrentUser } from "@/lib/session"
import type { Visibility } from "@/lib/api-types"
import type { FormState } from "@/lib/campaign"

export type { FormState }

/** Trimmed string, or null when the field is absent or blank. */
export function campaignText(formData: FormData, key: string): string | null {
  const raw = formData.get(key)
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  return trimmed === "" ? null : trimmed
}

export function campaignInteger(
  formData: FormData,
  key: string
): number | null {
  const raw = campaignText(formData, key)
  if (raw === null) return null
  const value = Number(raw)
  return Number.isInteger(value) ? value : null
}

export function campaignCheckbox(formData: FormData, key: string): boolean {
  const raw = formData.get(key)
  return raw === "on" || raw === "true"
}

export function campaignVisibility(
  formData: FormData,
  key = "visibility"
): Visibility {
  return formData.get(key) === "gm_only" ? "gm_only" : "public"
}

/** Repeated `traitId` inputs from the trait picker, de-duplicated. */
export function campaignTraitIds(formData: FormData): string[] {
  return [
    ...new Set(
      formData
        .getAll("traitId")
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
    ),
  ]
}

/** Comma-separated free-text field, e.g. faction assets or patron job types. */
export function campaignList(formData: FormData, key: string): string[] {
  const raw = campaignText(formData, key)
  if (!raw) return []
  return [
    ...new Set(raw.split(",").map((item) => item.trim()).filter(Boolean)),
  ]
}

/** Narrows a submitted value to a known enum member, falling back to a default. */
export function campaignEnum<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[],
  fallback: T
): T {
  const raw = campaignText(formData, key)
  return allowed.find((value) => value === raw) ?? fallback
}

/** As above, but leaves the field unset when nothing valid was submitted. */
export function campaignNullableEnum<T extends string>(
  formData: FormData,
  key: string,
  allowed: readonly T[]
): T | null {
  const raw = campaignText(formData, key)
  return allowed.find((value) => value === raw) ?? null
}

/**
 * Campaign world writes are Game Master only. Returns an error message to show
 * in the form, or null when the caller may proceed.
 */
export async function requireGameMaster(): Promise<string | null> {
  const user = await getCurrentUser()
  if (!user) return "You must be signed in."
  if (user.role !== "admin") return "Game Master access required."
  return null
}
