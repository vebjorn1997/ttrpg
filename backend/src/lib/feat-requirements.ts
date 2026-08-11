/**
 * Structured feat prerequisites — evaluated against character skills and owned feats.
 * Display copy stays in `feats.prerequisites`; this AST drives eligibility checks.
 */
export type FeatRequirement =
  | { type: 'skill'; skill: string; minLevel: number }
  | { type: 'feat'; feat: string }
  | { type: 'totalSkills'; min: number }
  | { type: 'all'; of: FeatRequirement[] }
  | { type: 'any'; of: FeatRequirement[] }

export type SkillLevel = {
  name: string
  level: number
}

function norm(value: string): string {
  return value.trim().toLowerCase()
}

function skillLevel(skills: SkillLevel[], skillName: string): number | null {
  const target = norm(skillName)
  const match = skills.find((skill) => norm(skill.name) === target)
  return match ? match.level : null
}

function totalSkillLevels(skills: SkillLevel[]): number {
  return skills.reduce((sum, skill) => sum + skill.level, 0)
}

export function meetsFeatRequirement(
  requirement: FeatRequirement | null | undefined,
  skills: SkillLevel[],
  ownedFeatNames: Iterable<string>,
): boolean {
  if (!requirement) return true

  const owned = new Set([...ownedFeatNames].map(norm))

  const check = (req: FeatRequirement): boolean => {
    switch (req.type) {
      case 'skill': {
        const level = skillLevel(skills, req.skill)
        return level !== null && level >= req.minLevel
      }
      case 'feat':
        return owned.has(norm(req.feat))
      case 'totalSkills':
        return totalSkillLevels(skills) >= req.min
      case 'all':
        return req.of.every(check)
      case 'any':
        return req.of.some(check)
      default:
        return false
    }
  }

  return check(requirement)
}

/** True when every feat is eligible given skills + the full selected feat set. */
export function validateFeatSelections(
  feats: { name: string; requirements: FeatRequirement | null }[],
  skills: SkillLevel[],
): { ok: true } | { ok: false; unmet: string[] } {
  const ownedNames = feats.map((feat) => feat.name)
  const unmet = feats
    .filter(
      (feat) =>
        !meetsFeatRequirement(feat.requirements, skills, ownedNames),
    )
    .map((feat) => feat.name)

  return unmet.length === 0 ? { ok: true } : { ok: false, unmet }
}

export function isFeatRequirement(value: unknown): value is FeatRequirement {
  if (!value || typeof value !== 'object') return false
  const req = value as { type?: unknown }

  switch (req.type) {
    case 'skill': {
      const r = value as { skill?: unknown; minLevel?: unknown }
      return (
        typeof r.skill === 'string' &&
        r.skill.trim() !== '' &&
        typeof r.minLevel === 'number' &&
        Number.isInteger(r.minLevel) &&
        r.minLevel >= 0
      )
    }
    case 'feat': {
      const r = value as { feat?: unknown }
      return typeof r.feat === 'string' && r.feat.trim() !== ''
    }
    case 'totalSkills': {
      const r = value as { min?: unknown }
      return typeof r.min === 'number' && Number.isInteger(r.min) && r.min >= 0
    }
    case 'all':
    case 'any': {
      const r = value as { of?: unknown }
      return Array.isArray(r.of) && r.of.every(isFeatRequirement)
    }
    default:
      return false
  }
}
