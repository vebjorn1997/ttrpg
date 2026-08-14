import type { CharacterSkill } from "@/lib/api-types"

/** Catalog skill that specializes into a spoken language. */
export function isLanguageSkill(name: string): boolean {
  return name.trim().toLowerCase() === "language"
}

/** Stable identity for picked skills (Language is unique per language). */
export function characterSkillKey(skill: CharacterSkill): string {
  const name = skill.name.trim().toLowerCase()
  if (isLanguageSkill(skill.name) && skill.language?.trim()) {
    return `${name}::${skill.language.trim().toLowerCase()}`
  }
  return name
}

/** Sheet / picker label, e.g. "Language (Common)". */
export function formatCharacterSkillLabel(skill: CharacterSkill): string {
  if (isLanguageSkill(skill.name) && skill.language?.trim()) {
    return `${skill.name.trim()} (${skill.language.trim()})`
  }
  return skill.name.trim()
}

/** Sum of every skill level on the sheet (Language entries count separately). */
export function totalSkillLevel(skills: CharacterSkill[]): number {
  return skills.reduce((sum, skill) => sum + skill.level, 0)
}
