import type { CharacterSkill, Feat } from "@/lib/api"
import { meetsFeatRequirement } from "@/lib/feat-requirements"

/** Drop feats that no longer meet skills / dependent-feat prerequisites. */
export function pruneInvalidFeats(
  featIds: string[],
  catalog: Feat[],
  skills: CharacterSkill[]
): string[] {
  let next = featIds
  for (let pass = 0; pass < catalog.length + 1; pass++) {
    const names = new Set(
      catalog.filter((feat) => next.includes(feat.id)).map((feat) => feat.name)
    )
    const pruned = next.filter((id) => {
      const feat = catalog.find((row) => row.id === id)
      if (!feat) return false
      return meetsFeatRequirement(feat.requirements, skills, names)
    })
    if (pruned.length === next.length) return pruned
    next = pruned
  }
  return next
}
