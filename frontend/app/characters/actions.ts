"use server"

import { redirect } from "next/navigation"

import {
  createCharacter,
  deleteCharacter,
  updateCharacter,
  type CharacterSkill,
  type CreateCharacterInput,
  type UpdateCharacterInput,
} from "@/lib/api"

export type CreateCharacterState = {
  error: string | null
}

export type UpdateCharacterState = {
  error: string | null
}

export type DeleteCharacterState = {
  error: string | null
}

function readInt(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key)
  if (raw === null || raw === "") return fallback
  const n = Number(raw)
  return Number.isInteger(n) && n >= 0 ? n : NaN
}

function readOptionalString(formData: FormData, key: string): string | null {
  const raw = formData.get(key)
  if (typeof raw !== "string") return null
  const trimmed = raw.trim()
  return trimmed === "" ? null : trimmed
}

function parseLineList(value: string | null): string[] {
  if (!value) return []
  return value
    .split(/[\n,]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function parseSkills(formData: FormData): CharacterSkill[] | { error: string } {
  const names = formData
    .getAll("skillName")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
  const levels = formData.getAll("skillLevel")
  const languages = formData.getAll("skillLanguage")

  if (names.length === 0) return []

  const skills: CharacterSkill[] = []
  const seen = new Set<string>()

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    const isLanguage = name.toLowerCase() === "language"
    const rawLanguage = languages[i]
    const language =
      typeof rawLanguage === "string" && rawLanguage.trim() !== ""
        ? rawLanguage.trim()
        : null

    if (isLanguage && !language) {
      return { error: `Language skill needs a specific language.` }
    }
    if (!isLanguage && language) {
      return { error: `Skill "${name}" cannot have a language specialty.` }
    }

    const key = isLanguage
      ? `language::${language!.toLowerCase()}`
      : name.toLowerCase()
    if (seen.has(key)) {
      return {
        error: isLanguage
          ? `Language "${language}" was added more than once.`
          : `Skill "${name}" was added more than once.`,
      }
    }
    seen.add(key)

    const rawLevel = levels[i]
    const level =
      typeof rawLevel === "string" && rawLevel.trim() !== ""
        ? Number(rawLevel)
        : NaN

    if (!Number.isInteger(level) || level < 0) {
      return {
        error: `Skill "${isLanguage ? `Language (${language})` : name}" needs a non-negative whole-number level.`,
      }
    }

    skills.push(language ? { name, level, language } : { name, level })
  }

  return skills
}

function parseFeatIds(formData: FormData): string[] | { error: string } {
  const ids = formData
    .getAll("featId")
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)

  const unique = [...new Set(ids)]
  if (unique.length !== ids.length) {
    return { error: "A feat was selected more than once." }
  }
  return unique
}

export async function createCharacterAction(
  _prev: CreateCharacterState,
  formData: FormData
): Promise<CreateCharacterState> {
  const name = readOptionalString(formData, "name")
  if (!name) {
    return { error: "Name is required." }
  }

  const strMax = readInt(formData, "strMax", 7)
  const dexMax = readInt(formData, "dexMax", 7)
  const endMax = readInt(formData, "endMax", 7)
  const strCurrent = readInt(formData, "strCurrent", strMax)
  const dexCurrent = readInt(formData, "dexCurrent", dexMax)
  const endCurrent = readInt(formData, "endCurrent", endMax)
  const int = readInt(formData, "int", 7)
  const soc = readInt(formData, "soc", 7)
  const edu = readInt(formData, "edu", 7)
  const credits = readInt(formData, "credits", 0)
  const armorTotal = readInt(formData, "armorTotal", 0)

  for (const [label, value] of [
    ["STR max", strMax],
    ["DEX max", dexMax],
    ["END max", endMax],
    ["STR current", strCurrent],
    ["DEX current", dexCurrent],
    ["END current", endCurrent],
    ["INT", int],
    ["SOC", soc],
    ["EDU", edu],
    ["credits", credits],
    ["armor total", armorTotal],
  ] as const) {
    if (Number.isNaN(value)) {
      return { error: `${label} must be a non-negative whole number.` }
    }
  }

  const skillsResult = parseSkills(formData)
  if ("error" in skillsResult) {
    return { error: skillsResult.error }
  }

  const featIdsResult = parseFeatIds(formData)
  if ("error" in featIdsResult) {
    return { error: featIdsResult.error }
  }

  const input: CreateCharacterInput = {
    name,
    playerName: readOptionalString(formData, "playerName"),
    str: { max: strMax, current: strCurrent },
    dex: { max: dexMax, current: dexCurrent },
    end: { max: endMax, current: endCurrent },
    int,
    soc,
    edu,
    skills: skillsResult,
    featIds: featIdsResult,
    movement: readOptionalString(formData, "movement"),
    armor: {
      total: armorTotal,
      bottom: readOptionalString(formData, "armorBottom"),
      top: readOptionalString(formData, "armorTop"),
      outer: readOptionalString(formData, "armorOuter"),
    },
    weapons: parseLineList(readOptionalString(formData, "weapons")),
    equipment: parseLineList(readOptionalString(formData, "equipment")),
    credits,
    notes: readOptionalString(formData, "notes"),
  }

  const result = await createCharacter(input)
  if (!result.ok) {
    return { error: result.error }
  }

  redirect(`/characters/${result.data.id}`)
}

export async function updateCharacterAction(
  _prev: UpdateCharacterState,
  formData: FormData
): Promise<UpdateCharacterState> {
  const id = readOptionalString(formData, "id")
  if (!id) {
    return { error: "Missing character id." }
  }

  const name = readOptionalString(formData, "name")
  if (!name) {
    return { error: "Name is required." }
  }

  const strMax = readInt(formData, "strMax", 7)
  const dexMax = readInt(formData, "dexMax", 7)
  const endMax = readInt(formData, "endMax", 7)

  for (const [label, value] of [
    ["STR max", strMax],
    ["DEX max", dexMax],
    ["END max", endMax],
  ] as const) {
    if (Number.isNaN(value)) {
      return { error: `${label} must be a non-negative whole number.` }
    }
  }

  const skillsResult = parseSkills(formData)
  if ("error" in skillsResult) {
    return { error: skillsResult.error }
  }

  const featIdsResult = parseFeatIds(formData)
  if ("error" in featIdsResult) {
    return { error: featIdsResult.error }
  }

  const input: UpdateCharacterInput = {
    name,
    strMax,
    dexMax,
    endMax,
    skills: skillsResult,
    featIds: featIdsResult,
  }

  const result = await updateCharacter(id, input)
  if (!result.ok) {
    return { error: result.error }
  }

  redirect(`/characters/${result.data.id}`)
}

export async function deleteCharacterAction(
  _prev: DeleteCharacterState,
  formData: FormData
): Promise<DeleteCharacterState> {
  const id = formData.get("id")
  if (typeof id !== "string" || id.trim() === "") {
    return { error: "Missing character id." }
  }

  const result = await deleteCharacter(id.trim())
  if (!result.ok) {
    return { error: result.error }
  }

  redirect("/characters")
}
