import type { Action } from "@/lib/api-types"

function isReaction(action: Action): boolean {
  return action.type.toLowerCase() === "reaction"
}

/** Actions with no feat requirement, plus those unlocked by the character's feats. */
export function actionsAvailableToCharacter(
  actions: Action[],
  ownedFeatIds: Iterable<string>
): Action[] {
  const owned = new Set(ownedFeatIds)
  return actions
    .filter(
      (action) =>
        !action.requiredFeat || owned.has(action.requiredFeat.id)
    )
    .sort((a, b) => {
      // AP actions first (by cost), reactions after.
      const reactionA = isReaction(a)
      const reactionB = isReaction(b)
      if (reactionA !== reactionB) return reactionA ? 1 : -1
      if (a.cost !== b.cost) return a.cost - b.cost
      return a.name.localeCompare(b.name)
    })
}
