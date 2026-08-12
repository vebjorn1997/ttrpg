"use client"

import { useMemo } from "react"
import { Check } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Feat, CharacterSkill } from "@/lib/api-types"
import {
  describeFeatRequirement,
  meetsFeatRequirement,
} from "@/lib/feat-requirements"
import { cn } from "@/lib/utils"

const labelClass = "console-label text-muted-foreground"

type CharacterFeatPickerProps = {
  catalog: Feat[]
  skills: CharacterSkill[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  error?: string | null
}

/** Catalog feats with live prerequisite gating from current skills + selection. */
export function CharacterFeatPicker({
  catalog,
  skills,
  selectedIds,
  onChange,
  error,
}: CharacterFeatPickerProps) {
  const selected = useMemo(() => new Set(selectedIds), [selectedIds])

  const selectedNames = useMemo(() => {
    const names = new Set<string>()
    for (const feat of catalog) {
      if (selected.has(feat.id)) names.add(feat.name)
    }
    return names
  }, [catalog, selected])

  const grouped = useMemo(() => {
    const byType = new Map<string, Feat[]>()
    for (const feat of catalog) {
      const list = byType.get(feat.type) ?? []
      list.push(feat)
      byType.set(feat.type, list)
    }
    for (const list of byType.values()) {
      list.sort((a, b) => a.name.localeCompare(b.name))
    }
    return [...byType.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [catalog])

  function toggle(feat: Feat, available: boolean) {
    if (!available) return
    if (selected.has(feat.id)) {
      const nextIds = selectedIds.filter((id) => id !== feat.id)
      // Drop any feats that depended on this one
      const nextNames = new Set(
        catalog
          .filter((row) => nextIds.includes(row.id))
          .map((row) => row.name)
      )
      const pruned = nextIds.filter((id) => {
        const row = catalog.find((featRow) => featRow.id === id)
        if (!row) return false
        return meetsFeatRequirement(row.requirements, skills, nextNames)
      })
      onChange(pruned)
      return
    }
    onChange([...selectedIds, feat.id])
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className={labelClass}>Feats</p>
        {selectedIds.length > 0 && (
          <span className="console-label text-muted-foreground/70">
            {selectedIds.length} selected
          </span>
        )}
      </div>

      {error ? (
        <p className="border border-oxide/40 bg-oxide/10 px-3 py-2 text-sm text-oxide">
          Feat catalog unavailable ({error}). You can still create the sheet
          without feats.
        </p>
      ) : catalog.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No feats in the catalog yet.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([type, feats]) => (
            <div key={type}>
              <p className="console-label mb-2 text-ochre/80">{type}</p>
              <ul className="divide-y divide-hairline border border-hairline bg-background/30">
                {feats.map((feat) => {
                  const isSelected = selected.has(feat.id)
                  const available = meetsFeatRequirement(
                    feat.requirements,
                    skills,
                    selectedNames
                  )
                  const locked = !available
                  const requirementLabel =
                    feat.prerequisites?.trim() ||
                    describeFeatRequirement(feat.requirements)
                  const description = feat.description?.trim() || null

                  const row = (
                    <button
                      type="button"
                      disabled={locked && !isSelected}
                      aria-pressed={isSelected}
                      onClick={() => toggle(feat, available || isSelected)}
                      className={cn(
                        "flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors",
                        locked &&
                          !isSelected &&
                          "cursor-not-allowed bg-background/20 opacity-45",
                        locked && isSelected && "opacity-70",
                        !locked &&
                          !isSelected &&
                          "hover:bg-ochre/5 focus-visible:bg-ochre/5",
                        isSelected && "bg-ochre/10"
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-0.5 flex size-4 shrink-0 items-center justify-center border border-hairline",
                          isSelected && "border-ochre bg-ochre/30 text-ochre",
                          locked && "border-muted-foreground/30"
                        )}
                      >
                        {isSelected ? <Check className="size-3" /> : null}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block font-heading text-sm tracking-wide",
                            locked && "text-muted-foreground"
                          )}
                        >
                          {feat.name}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {requirementLabel === "None" || !requirementLabel
                            ? "No prerequisite"
                            : `Requires ${requirementLabel}`}
                        </span>
                      </span>
                    </button>
                  )

                  return (
                    <li key={feat.id}>
                      {description ? (
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="block w-full" />}
                            aria-label={`${feat.name}: ${description}`}
                          >
                            {row}
                          </TooltipTrigger>
                          <TooltipContent
                            side="bottom"
                            sideOffset={8}
                            className="max-w-sm rounded-none border border-hairline bg-card px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-md"
                          >
                            <span className="block font-heading text-[0.7rem] tracking-[0.12em] uppercase text-ochre">
                              {feat.name}
                            </span>
                            <span className="mt-1 block">{description}</span>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        row
                      )}
                      {isSelected ? (
                        <input type="hidden" name="featId" value={feat.id} />
                      ) : null}
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
