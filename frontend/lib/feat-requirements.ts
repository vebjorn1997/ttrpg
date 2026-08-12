/**
 * Structured feat prerequisites — evaluated against character skills and owned feats.
 * Mirrors backend/src/lib/feat-requirements.ts for client-side eligibility UI.
 */
export type FeatRequirement =
  | { type: "skill"; skill: string; minLevel: number }
  | { type: "feat"; feat: string }
  | { type: "totalSkills"; min: number }
  | { type: "all"; of: FeatRequirement[] }
  | { type: "any"; of: FeatRequirement[] }

export type SkillLevel = {
  name: string
  level: number
}

function norm(value: string): string {
  return value.trim().toLowerCase()
}

function skillLevel(skills: SkillLevel[], skillName: string): number | null {
  const target = norm(skillName)
  let best: number | null = null
  for (const skill of skills) {
    if (norm(skill.name) !== target) continue
    if (best === null || skill.level > best) best = skill.level
  }
  return best
}

function totalSkillLevels(skills: SkillLevel[]): number {
  return skills.reduce((sum, skill) => sum + skill.level, 0)
}

export function meetsFeatRequirement(
  requirement: FeatRequirement | null | undefined,
  skills: SkillLevel[],
  ownedFeatNames: Iterable<string>
): boolean {
  if (!requirement) return true

  const owned = new Set([...ownedFeatNames].map(norm))

  const check = (req: FeatRequirement): boolean => {
    switch (req.type) {
      case "skill": {
        const level = skillLevel(skills, req.skill)
        return level !== null && level >= req.minLevel
      }
      case "feat":
        return owned.has(norm(req.feat))
      case "totalSkills":
        return totalSkillLevels(skills) >= req.min
      case "all":
        return req.of.every(check)
      case "any":
        return req.of.some(check)
      default:
        return false
    }
  }

  return check(requirement)
}

/** Human-readable shortfall hint when a feat is locked. */
export function describeFeatRequirement(
  requirement: FeatRequirement | null | undefined
): string {
  if (!requirement) return "None"

  switch (requirement.type) {
    case "skill":
      return `${requirement.skill} ${requirement.minLevel}+`
    case "feat":
      return `${requirement.feat} feat`
    case "totalSkills":
      return `Total skills ${requirement.min}+`
    case "all":
      return requirement.of.map(describeFeatRequirement).join(" & ")
    case "any":
      return requirement.of.map(describeFeatRequirement).join(" or ")
    default:
      return "Unknown"
  }
}
