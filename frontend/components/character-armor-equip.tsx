"use client"

import {
  createContext,
  use,
  useOptimistic,
  useState,
  useTransition,
  type ReactNode,
} from "react"
import { Check } from "lucide-react"

import { setEquippedArmorAction } from "@/app/characters/actions"
import { TraitBadge } from "@/components/trait-badge"
import { StatReadout } from "@/components/stat-readout"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CharacterEquipmentItem, Trait } from "@/lib/api-types"
import {
  combatArmorFromItems,
  formatArmorLayer,
  toggleEquippedArmor,
} from "@/lib/character-armor"
import { namedTraitTags } from "@/lib/records"
import { cn } from "@/lib/utils"

type ArmorEquipContextValue = {
  items: CharacterEquipmentItem[]
  pending: boolean
  error: string | null
  toggle: (equipmentId: string) => void
}

const ArmorEquipContext = createContext<ArmorEquipContextValue | null>(null)

function useArmorEquip() {
  const value = use(ArmorEquipContext)
  if (!value) {
    throw new Error("Armor equip controls must wrap the character sheet.")
  }
  return value
}

export function CharacterArmorEquipProvider({
  characterId,
  items,
  children,
}: {
  characterId: string
  items: CharacterEquipmentItem[]
  children: ReactNode
}) {
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const [optimisticItems, addOptimistic] = useOptimistic(
    items,
    (
      current: CharacterEquipmentItem[],
      update: { equipmentId: string; equipped: boolean }
    ) => toggleEquippedArmor(current, update.equipmentId, update.equipped)
  )

  function toggle(equipmentId: string) {
    const target = optimisticItems.find((item) => item.id === equipmentId)
    if (!target) return
    const equipped = !target.equipped

    startTransition(async () => {
      setError(null)
      addOptimistic({ equipmentId, equipped })
      const result = await setEquippedArmorAction(
        characterId,
        equipmentId,
        equipped
      )
      if (result.error) setError(result.error)
    })
  }

  return (
    <ArmorEquipContext
      value={{ items: optimisticItems, pending, error, toggle }}
    >
      {children}
    </ArmorEquipContext>
  )
}

export function CombatArmorReadout() {
  const { items } = useArmorEquip()
  const profile = combatArmorFromItems(items)

  return (
    <>
      <StatReadout label="Armour" value={String(profile.total)} emphasis />
      <StatReadout label="Bottom" value={formatArmorLayer(items, "bottom")} />
      <StatReadout label="Top" value={formatArmorLayer(items, "top")} />
      <StatReadout label="Outer" value={formatArmorLayer(items, "outer")} />
    </>
  )
}

function compactStats(item: CharacterEquipmentItem): string {
  return [
    item.armor?.trim() ? `ARM ${item.armor.trim()}` : null,
    `×${item.quantity}`,
  ]
    .filter(Boolean)
    .join("  ")
}

export function CharacterSheetArmor({
  traits = [],
}: {
  traits?: Trait[]
}) {
  const { items, pending, error, toggle } = useArmorEquip()

  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">None listed.</p>
  }

  return (
    <div className="space-y-2">
      {error ? (
        <p
          role="alert"
          className="border border-oxide/50 bg-oxide/10 px-3 py-2 font-mono text-xs text-oxide"
        >
          {error}
        </p>
      ) : null}
      <ul className="space-y-0.5">
        {items.map((item) => {
          const tags = namedTraitTags(item.trait, traits)
          const description = item.description?.trim() || null
          const equipped = Boolean(item.equipped)

          return (
            <li key={item.id} className="flex items-start gap-2">
              <button
                type="button"
                role="checkbox"
                aria-checked={equipped}
                aria-label={`Equip ${item.name}`}
                disabled={pending}
                onClick={() => toggle(item.id)}
                className={cn(
                  "mt-1 flex size-4 shrink-0 items-center justify-center border border-hairline transition-colors",
                  equipped && "border-ochre bg-ochre/30 text-ochre",
                  pending && "opacity-70"
                )}
              >
                {equipped ? <Check className="size-3" /> : null}
              </button>
              <Tooltip>
                <TooltipTrigger
                  render={<span className="block min-w-0 flex-1" />}
                  aria-label={`${item.name}: ${compactStats(item)}`}
                >
                  <span className="flex cursor-help items-baseline gap-2 px-0.5 py-1">
                    <span
                      className={cn(
                        "min-w-0 flex-1 truncate font-heading text-sm tracking-wide",
                        equipped && "text-ochre"
                      )}
                    >
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
                  <span className="mt-1 block font-mono text-[0.7rem] text-muted-foreground">
                    {item.type}
                    {item.armor?.trim() ? ` · ARM ${item.armor.trim()}` : ""}
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
    </div>
  )
}
