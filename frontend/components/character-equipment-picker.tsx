"use client"

import { useMemo, useState } from "react"
import { Check, ChevronRight, Minus, Plus } from "lucide-react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Equipment } from "@/lib/api-types"
import { cn, formatEquipmentCost, formatRangeWithClose } from "@/lib/utils"

const labelClass = "console-label text-muted-foreground"

export type EquipmentQuantities = Record<string, number>

type CharacterEquipmentPickerProps = {
  catalog: Equipment[]
  quantities: EquipmentQuantities
  onChange: (next: EquipmentQuantities) => void
  error?: string | null
}

type TypeGroup = {
  type: string
  items: Equipment[]
}

type CategoryGroup = {
  category: string
  types: TypeGroup[]
  itemCount: number
}

function typeKey(category: string, type: string) {
  return `${category}::${type}`
}

function itemSummary(item: Equipment): string {
  const range = formatRangeWithClose(item.range)
  const isArmor = item.category.trim().toLowerCase() === "armor"
  if (isArmor) {
    return [
      item.armor?.trim() ? `ARM ${item.armor.trim()}` : null,
      formatEquipmentCost(item.cost),
    ]
      .filter(Boolean)
      .join(" · ")
  }
  return [
    formatEquipmentCost(item.cost),
    item.dmg ? `DMG ${item.dmg}` : null,
    range ? `Rng ${range}` : null,
  ]
    .filter(Boolean)
    .join(" · ")
}

function padCount(value: number) {
  return String(value).padStart(2, "0")
}

function qtyOf(quantities: EquipmentQuantities, id: string) {
  return quantities[id] ?? 0
}

function sumQty(items: Equipment[], quantities: EquipmentQuantities) {
  return items.reduce((total, item) => total + qtyOf(quantities, item.id), 0)
}

export function equipmentQuantityTotal(quantities: EquipmentQuantities) {
  return Object.values(quantities).reduce((total, qty) => total + qty, 0)
}

/** Catalog gear grouped by category, then type; submits selected ids as hidden fields. */
export function CharacterEquipmentPicker({
  catalog,
  quantities,
  onChange,
  error,
}: CharacterEquipmentPickerProps) {

  const grouped = useMemo((): CategoryGroup[] => {
    const byCategory = new Map<string, Map<string, Equipment[]>>()

    for (const item of catalog) {
      const category = item.category.trim() || "Unsorted"
      const type = item.type.trim() || "Other"
      const types = byCategory.get(category) ?? new Map<string, Equipment[]>()
      const list = types.get(type) ?? []
      list.push(item)
      types.set(type, list)
      byCategory.set(category, types)
    }

    return [...byCategory.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([category, types]) => {
        const typeGroups = [...types.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([type, items]) => ({
            type,
            items: [...items].sort((a, b) => a.name.localeCompare(b.name)),
          }))

        return {
          category,
          types: typeGroups,
          itemCount: typeGroups.reduce(
            (total, group) => total + group.items.length,
            0
          ),
        }
      })
  }, [catalog])

  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => {
    const closed = new Set<string>()
    for (const category of grouped) {
      let categoryHasSelection = false
      for (const type of category.types) {
        const typeHasSelection = type.items.some(
          (item) => qtyOf(quantities, item.id) > 0
        )
        if (typeHasSelection) categoryHasSelection = true
        else closed.add(typeKey(category.category, type.type))
      }
      if (!categoryHasSelection) closed.add(category.category)
    }
    return closed
  })

  function setQuantity(id: string, quantity: number) {
    const next = { ...quantities }
    if (quantity < 1) delete next[id]
    else next[id] = quantity
    onChange(next)
  }

  function toggleSection(key: string) {
    setCollapsed((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className={labelClass}>Black Market Emporium</p>
        {equipmentQuantityTotal(quantities) > 0 && (
          <span className="console-label text-muted-foreground/70">
            {equipmentQuantityTotal(quantities)} selected
          </span>
        )}
      </div>

      {Object.entries(quantities)
        .filter(([, quantity]) => quantity > 0)
        .map(([id, quantity]) => (
          <span key={id}>
            <input type="hidden" name="equipmentId" value={id} />
            <input type="hidden" name="equipmentQty" value={quantity} />
          </span>
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
        <div className="space-y-2">
          {grouped.map((category) => {
            const categoryOpen = !collapsed.has(category.category)
            const selectedInCategory = category.types.reduce(
              (total, type) => total + sumQty(type.items, quantities),
              0
            )

            return (
              <div
                key={category.category}
                className="border border-hairline bg-background/30"
              >
                <button
                  type="button"
                  onClick={() => toggleSection(category.category)}
                  aria-expanded={categoryOpen}
                  className="flex w-full items-center gap-1.5 px-3 py-2 text-left transition-colors hover:bg-ochre/5 focus-visible:bg-ochre/5 focus-visible:outline-none"
                >
                  <ChevronRight
                    aria-hidden
                    className={cn(
                      "size-3 shrink-0 text-muted-foreground transition-transform",
                      categoryOpen && "rotate-90"
                    )}
                  />
                  <span className="console-label text-ochre">{category.category}</span>
                  <span className="console-label ml-auto text-muted-foreground/60">
                    {selectedInCategory > 0
                      ? `${padCount(selectedInCategory)} / ${padCount(category.itemCount)}`
                      : padCount(category.itemCount)}
                  </span>
                </button>

                {categoryOpen ? (
                  <div className="border-t border-hairline">
                    {category.types.map((type) => {
                      const key = typeKey(category.category, type.type)
                      const typeOpen = !collapsed.has(key)
                      const selectedInType = sumQty(type.items, quantities)

                      return (
                        <div
                          key={key}
                          className="border-b border-hairline last:border-b-0"
                        >
                          <button
                            type="button"
                            onClick={() => toggleSection(key)}
                            aria-expanded={typeOpen}
                            className="flex w-full items-center gap-1.5 px-3 py-2 pl-7 text-left transition-colors hover:bg-ochre/5 focus-visible:bg-ochre/5 focus-visible:outline-none"
                          >
                            <ChevronRight
                              aria-hidden
                              className={cn(
                                "size-3 shrink-0 text-muted-foreground transition-transform",
                                typeOpen && "rotate-90"
                              )}
                            />
                            <span className="console-label text-ochre/80">
                              {type.type}
                            </span>
                            <span className="console-label ml-auto text-muted-foreground/60">
                              {selectedInType > 0
                                ? `${padCount(selectedInType)} / ${padCount(type.items.length)}`
                                : padCount(type.items.length)}
                            </span>
                          </button>

                          {typeOpen ? (
                            <ul className="divide-y divide-hairline border-t border-hairline">
                              {type.items.map((item) => {
                                const quantity = qtyOf(quantities, item.id)
                                const isSelected = quantity > 0
                                const summary = itemSummary(item)
                                const description =
                                  item.description?.trim() || null

                                const row = (
                                  <button
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => {
                                      if (!isSelected) setQuantity(item.id, 1)
                                    }}
                                    className={cn(
                                      "flex w-full items-start gap-3 px-3 py-2.5 pl-11 text-left transition-colors",
                                      !isSelected &&
                                        "hover:bg-ochre/5 focus-visible:bg-ochre/5"
                                    )}
                                  >
                                    <span
                                      aria-hidden
                                      className={cn(
                                        "mt-0.5 flex size-4 shrink-0 items-center justify-center border border-hairline",
                                        isSelected &&
                                          "border-ochre bg-ochre/30 text-ochre"
                                      )}
                                    >
                                      {isSelected ? (
                                        <Check className="size-3" />
                                      ) : null}
                                    </span>
                                    <span className="min-w-0 flex-1">
                                      <span className="block truncate font-heading text-sm tracking-wide">
                                        {item.name}
                                      </span>
                                      {summary ? (
                                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                          {summary}
                                        </span>
                                      ) : null}
                                    </span>
                                  </button>
                                )

                                return (
                                  <li
                                    key={item.id}
                                    className={cn(
                                      "flex min-w-0 items-stretch",
                                      isSelected && "bg-ochre/10"
                                    )}
                                  >
                                    <div className="min-w-0 flex-1">
                                      {description ? (
                                        <Tooltip>
                                          <TooltipTrigger
                                            render={
                                              <span className="block w-full" />
                                            }
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
                                            <span className="mt-1 block">
                                              {description}
                                            </span>
                                          </TooltipContent>
                                        </Tooltip>
                                      ) : (
                                        row
                                      )}
                                    </div>
                                    {isSelected ? (
                                      <div className="flex w-16 shrink-0 flex-col items-center justify-center gap-0.5 py-1 pr-2">
                                        <button
                                          type="button"
                                          aria-label={`Increase ${item.name}`}
                                          onClick={() =>
                                            setQuantity(item.id, quantity + 1)
                                          }
                                          className="flex size-5 items-center justify-center text-muted-foreground transition-colors hover:text-ochre"
                                        >
                                          <Plus className="size-3" />
                                        </button>
                                        <span className="font-mono text-[0.7rem] leading-none">
                                          {quantity}
                                        </span>
                                        <button
                                          type="button"
                                          aria-label={`Decrease ${item.name}`}
                                          onClick={() =>
                                            setQuantity(item.id, quantity - 1)
                                          }
                                          className="flex size-5 items-center justify-center text-muted-foreground transition-colors hover:text-ochre"
                                        >
                                          <Minus className="size-3" />
                                        </button>
                                      </div>
                                    ) : null}
                                  </li>
                                )
                              })}
                            </ul>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
