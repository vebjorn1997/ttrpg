import type { CharacterEquipmentItem } from "@/lib/api-types"

export type LoadoutBucket = "weapons" | "armor" | "equipment"

const WEAPON_CATEGORIES = new Set([
  "slug",
  "heavy",
  "explosive",
  "melee",
  "laser",
])

export function loadoutBucket(item: CharacterEquipmentItem): LoadoutBucket {
  const category = item.category.trim().toLowerCase()
  if (category === "armor") return "armor"
  if (WEAPON_CATEGORIES.has(category) || Boolean(item.dmg?.trim())) {
    return "weapons"
  }
  return "equipment"
}

export function partitionLoadout(items: CharacterEquipmentItem[]) {
  const weapons: CharacterEquipmentItem[] = []
  const armor: CharacterEquipmentItem[] = []
  const equipment: CharacterEquipmentItem[] = []

  for (const item of items) {
    const bucket = loadoutBucket(item)
    if (bucket === "weapons") weapons.push(item)
    else if (bucket === "armor") armor.push(item)
    else equipment.push(item)
  }

  const byName = (a: CharacterEquipmentItem, b: CharacterEquipmentItem) =>
    a.name.localeCompare(b.name)

  return {
    weapons: weapons.sort(byName),
    armor: armor.sort(byName),
    equipment: equipment.sort(byName),
  }
}
