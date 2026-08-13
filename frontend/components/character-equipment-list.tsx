import { ConsolePanel } from "@/components/console-panel"
import { RuleText } from "@/components/rule-text"
import { StatReadout } from "@/components/stat-readout"
import { TraitBadge } from "@/components/trait-badge"
import type { CharacterEquipmentItem, Trait } from "@/lib/api-types"
import { namedTraitTags } from "@/lib/records"
import type { RuleLinkEntry } from "@/lib/rule-links"
import { formatEquipmentCost, formatRangeWithClose } from "@/lib/utils"

function groupedByType(
  items: CharacterEquipmentItem[]
): [string, CharacterEquipmentItem[]][] {
  const byType = new Map<string, CharacterEquipmentItem[]>()
  for (const item of items) {
    const list = byType.get(item.type) ?? []
    list.push(item)
    byType.set(item.type, list)
  }
  for (const list of byType.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }
  return [...byType.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function statsFor(item: CharacterEquipmentItem): { label: string; value: string; primary?: boolean }[] {
  const stats: { label: string; value: string; primary?: boolean }[] = []
  const push = (label: string, value: string | null | undefined, primary = false) => {
    const trimmed = value?.trim()
    if (!trimmed) return
    stats.push({ label, value: trimmed, primary })
  }

  push("Qty", item.quantity > 1 ? String(item.quantity) : null, true)
  push("Cost", formatEquipmentCost(item.cost), true)
  push("TL", item.tl, true)
  push("DMG", item.dmg, true)
  push("Range", formatRangeWithClose(item.range), true)
  push("Mag", item.mag)
  push("Armour", item.armor)
  push("Class", item.weaponClassification)
  return stats
}

/** Catalog loadout on a filed character, grouped by equipment type. */
export function CharacterEquipmentList({
  items,
  traits = [],
  links = [],
}: {
  items: CharacterEquipmentItem[]
  traits?: Trait[]
  links?: RuleLinkEntry[]
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing from the Emporium on this sheet. Use Edit sheet to lift wares
        off the black market.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {groupedByType(items).map(([type, typeItems]) => (
        <ConsolePanel key={type} label={type} code="BLK" accent="oxide">
          <ul className="space-y-5">
            {typeItems.map((item) => {
              const tags = namedTraitTags(item.trait, traits)

              return (
                <li key={item.id}>
                  <p className="font-heading text-sm tracking-wide uppercase">
                    {item.name}
                    {item.quantity > 1 ? (
                      <span className="ml-2 font-mono text-ochre">
                        ×{item.quantity}
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.category}
                    {item.weaponClassification
                      ? ` · ${item.weaponClassification}`
                      : ""}
                  </p>
                  <div className="mt-2 space-y-1">
                    {statsFor(item).map((stat) => (
                      <StatReadout
                        key={stat.label}
                        label={stat.label}
                        value={stat.value}
                        emphasis={stat.primary}
                      />
                    ))}
                  </div>
                  {tags.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {tags.map((tag) => (
                        <TraitBadge key={tag.id ?? tag.label} tag={tag} />
                      ))}
                    </div>
                  ) : null}
                  {item.description ? (
                    <RuleText
                      text={item.description}
                      className="mt-2 text-sm leading-relaxed text-foreground/75"
                      links={links}
                      skipTitle={item.name}
                    />
                  ) : null}
                </li>
              )
            })}
          </ul>
        </ConsolePanel>
      ))}
    </div>
  )
}
