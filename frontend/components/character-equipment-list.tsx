import { ConsolePanel } from "@/components/console-panel"
import { RuleText } from "@/components/rule-text"
import { StatReadout } from "@/components/stat-readout"
import type { Equipment } from "@/lib/api-types"
import type { RuleLinkEntry } from "@/lib/rule-links"

function groupedByType(items: Equipment[]): [string, Equipment[]][] {
  const byType = new Map<string, Equipment[]>()
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

function statsFor(item: Equipment): { label: string; value: string; primary?: boolean }[] {
  const stats: { label: string; value: string; primary?: boolean }[] = []
  const push = (label: string, value: string | null | undefined, primary = false) => {
    const trimmed = value?.trim()
    if (!trimmed) return
    stats.push({ label, value: trimmed, primary })
  }

  push("Cost", item.cost, true)
  push("TL", item.tl, true)
  push("DMG", item.dmg, true)
  push("Range", item.range, true)
  push("Mag", item.mag)
  push("Armour", item.armor)
  push("Class", item.weaponClassification)
  push("Trait", item.trait)
  return stats
}

/** Catalog loadout on a filed character, grouped by equipment type. */
export function CharacterEquipmentList({
  items,
  links = [],
}: {
  items: Equipment[]
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
            {typeItems.map((item) => (
              <li key={item.id}>
                <p className="font-heading text-sm tracking-wide uppercase">
                  {item.name}
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
                {item.description ? (
                  <RuleText
                    text={item.description}
                    className="mt-2 text-sm leading-relaxed text-foreground/75"
                    links={links}
                    skipTitle={item.name}
                  />
                ) : null}
              </li>
            ))}
          </ul>
        </ConsolePanel>
      ))}
    </div>
  )
}
