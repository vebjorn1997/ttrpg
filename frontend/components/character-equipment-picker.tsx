"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Equipment } from "@/lib/api-types"
import { cn } from "@/lib/utils"

const labelClass = "console-label text-muted-foreground"

type CharacterEquipmentPickerProps = {
  catalog: Equipment[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string | null
}

function itemSummary(item: Equipment): string {
  return [
    item.category,
    item.cost,
    item.dmg ? `DMG ${item.dmg}` : null,
    item.range ? `Rng ${item.range}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

/** Catalog gear grouped by type; submits selected ids as hidden fields. */
export function CharacterEquipmentPicker({
  catalog,
  selectedIds,
  onChange,
  error,
}: CharacterEquipmentPickerProps) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const grouped = useMemo(() => {
    const byType = new Map<string, Equipment[]>()
    for (const item of catalog) {
      const list = byType.get(item.type) ?? []
      list.push(item)
      byType.set(item.type, list)
    }
    for (const list of byType.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return [...byType.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [catalog])

  function toggle(item: Equipment) {
    if (selected.has(item.id)) {
      onChange(selectedIds.filter((id) => id !== item.id))
      return
    }
    onChange([...selectedIds, item.id])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className={labelClass}>Black Market Emporium</p>
        {selectedIds.length > 0 && (
          <span className="console-label text-muted-foreground/70">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="equipmentId" value={id} />
      ))}

      {error ? (
        <p className="border border-oxide/40 bg-oxide/10 px-3 py-2 text-sm text-oxide">
          Emporium listings unavailable ({error}). You can still save the sheet
          without catalog gear.
        </p>
      ) : catalog.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          The Emporium is empty — no wares listed yet.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([type, items]) => (
            <div key={type}>
              <p className="console-label mb-2 text-ochre/80">{type}</p>
              <ul className="divide-y divide-hairline border border-hairline bg-background/30">
                {items.map((item) => {
                  const isSelected = selected.has(item.id)
                  const summary = itemSummary(item)
                  const description = item.description?.trim() || null

                  const row = (
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggle(item)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        !isSelected &&
                          "hover:bg-ochre/5 focus-visible:bg-ochre/5",
                        isSelected && "bg-ochre/10"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center border border-hairline",
                          isSelected && "border-ochre bg-ochre/30 text-ochre"
                        )}
                      >
                        {isSelected ? <Check className="size-3" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-heading text-sm tracking-wide">
                          {item.name}
                        </span>
                        {summary ? (
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {summary}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  )

                  return (
                    <li key={item.id}>
                      {description ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="block w-full" />}
                            aria-label={`${item.name}: ${description}`}
                          >
                            {row}
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            sideOffset={8}
                            className="max-w-sm rounded-none border border-hairline bg-card px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-md"
                          >
                            <span className="block font-heading text-[0.7rem] tracking-[0.12em] uppercase text-ochre">
                              {item.name}
                            </span>
                            <span className="mt-1 block">{description}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        row
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
