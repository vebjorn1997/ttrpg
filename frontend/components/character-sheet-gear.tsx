"use client"

import { TraitBadge } from "@/components/trait-badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CharacterEquipmentItem, Trait } from "@/lib/api-types"
import { namedTraitTags } from "@/lib/records"
import { formatRangeWithClose } from "@/lib/utils"

function compactStats(item: CharacterEquipmentItem): string {
  const range = formatRangeWithClose(item.range)
  return [
    item.dmg?.trim() ? `DMG ${item.dmg.trim()}` : null,
    item.armor?.trim() ? `ARM ${item.armor.trim()}` : null,
    range ? `RNG ${range}` : null,
    `×${item.quantity}`,
  ]
    .filter(Boolean)
    .join("  ")
}

/** Condensed loadout rows for the Sheet tab, with a hover readout. */
export function CharacterSheetGear({
  items,
  traits = [],
}: {
  items: CharacterEquipmentItem[]
  traits?: Trait[]
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None listed.</p>
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const tags = namedTraitTags(item.trait, traits)
        const description = item.description?.trim() || null

        return (
          <li key={item.id}>
            <Tooltip>
              <TooltipTrigger
                render={<span className="block w-full" />}
                aria-label={`${item.name}: ${compactStats(item)}`}
              >
                <span className="flex cursor-help items-baseline gap-2 px-0.5 py-1">
                  <span className="min-w-0 flex-1 truncate font-heading text-sm tracking-wide">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-mono text-[0.7rem] tracking-wide text-muted-foreground">
                    {compactStats(item)}
                  </span>
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                sideOffset={8}
                className="max-w-sm overflow-visible rounded-none border border-hairline bg-card px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-md"
              >
                <span className="block font-heading text-[0.7rem] tracking-[0.12em] uppercase text-ochre">
                  {item.name}
                </span>
                {description ? (
                  <span className="mt-1.5 block">{description}</span>
                ) : null}
                {tags.length > 0 ? (
                  <span className="mt-2 flex flex-wrap gap-1">
                    {tags.map((tag) => (
                      <TraitBadge key={tag.id ?? tag.label} tag={tag} />
                    ))}
                  </span>
                ) : null}
              </TooltipContent>
            </Tooltip>
          </li>
        )
      })}
    </ul>
  )
}
