"use server"

import { redirect } from "next/navigation"

import {
  createCharacter,
  type CharacterSkill,
  type CreateCharacterInput,
} from "@/lib/api"

export type CreateCharacterState = {
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

function parseSkills(raw: string | null): CharacterSkill[] | { error: string } {
  if (!raw) return []
  const skills: CharacterSkill[] = []
  for (const line of raw.split("\n")) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const match = trimmed.match(/^(.+?)\s+(\d+)\s*$/)
    if (!match) {
      return {
        error: `Skill line "${trimmed}" must look like "Gun 2".`,
      }
    }
    skills.push({ name: match[1].trim(), level: Number(match[2]) })
  }
  return skills
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

  const skillsResult = parseSkills(readOptionalString(formData, "skills"))
  if ("error" in skillsResult) {
    return { error: skillsResult.error }
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
