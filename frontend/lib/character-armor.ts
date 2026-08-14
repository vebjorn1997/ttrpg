export type ArmorLayer = "bottom" | "top" | "outer"

export type CombatArmor = {
  total: number
  bottom: string | null
  top: string | null
  outer: string | null
}

type ArmorItem = {
  id: string
  name: string
  type: string
  category: string
  armor: string | null
  equipped: boolean
}

export function isArmorItem(item: { category: string }): boolean {
  return item.category.trim().toLowerCase() === "armor"
}

export function armorLayer(type: string): ArmorLayer | null {
  const value = type.trim().toLowerCase()
  if (value === "bottom" || value === "top" || value === "outer") return value
  return null
}

export function parseArmorValue(armor: string | null | undefined): number {
  const trimmed = armor?.trim()
  if (!trimmed) return 0
  const match = trimmed.match(/-?\d+/)
  return match ? Number(match[0]) : 0
}

export function combatArmorFromItems(items: ArmorItem[]): CombatArmor {
  const equipped = items.filter((item) => item.equipped && isArmorItem(item))
  const byLayer: Partial<Record<ArmorLayer, string>> = {}
  let total = 0

  for (const item of equipped) {
    total += parseArmorValue(item.armor)
    const layer = armorLayer(item.type)
    if (layer && !byLayer[layer]) byLayer[layer] = item.name
  }

  return {
    total,
    bottom: byLayer.bottom ?? null,
    top: byLayer.top ?? null,
    outer: byLayer.outer ?? null,
  }
}

export function toggleEquippedArmor<
  T extends { id: string; type: string; equipped: boolean },
>(items: T[], equipmentId: string, equipped: boolean): T[] {
  const target = items.find((item) => item.id === equipmentId)
  if (!target) return items
  const layer = armorLayer(target.type)

  return items.map((item) => {
    if (item.id === equipmentId) return { ...item, equipped }
    if (equipped && layer && armorLayer(item.type) === layer) {
      return { ...item, equipped: false }
    }
    return item
  })
}

export function formatArmorLayer(items: ArmorItem[], layer: ArmorLayer): string {
  const item = items.find(
    (entry) => entry.equipped && armorLayer(entry.type) === layer
  )
  if (!item) return "—"
  return `${item.name} (${parseArmorValue(item.armor)})`
}
