"use client"

import { useMemo, useState } from "react"
import { Plus, X } from "lucide-react"

import { TraitBadge } from "@/components/trait-badge"
import { Button } from "@/components/ui/button"
import { labelClass, selectClass } from "@/components/campaign-fields"
import type { Trait } from "@/lib/api-types"

type CampaignTraitPickerProps = {
  /** Full trait glossary; filtered down to `type` before display. */
  catalog: Trait[]
  /** Trait `type` column value, e.g. "System" or "Ship". */
  type: string
  initialTraitIds?: string[]
  error?: string | null
  label?: string
  hint?: string
}

/**
 * Tags an entity with traits from the shared glossary. Selections are submitted
 * as repeated `traitId` hidden inputs so the enclosing server action can read
 * them with `formData.getAll`.
 */
export function CampaignTraitPicker({
  catalog,
  type,
  initialTraitIds = [],
  error = null,
  label = "Traits",
  hint,
}: CampaignTraitPickerProps) {
  const available = useMemo(
    () =>
      catalog
        .filter((trait) => trait.type.toLowerCase() === type.toLowerCase())
        .sort((a, b) => a.name.localeCompare(b.name)),
    [catalog, type]
  )

  const byId = useMemo(
    () => new Map(available.map((trait) => [trait.id, trait])),
    [available]
  )

  const [picked, setPicked] = useState<string[]>(() =>
    initialTraitIds.filter((id) => id)
  )
  const [pending, setPending] = useState("")

  const unpicked = available.filter((trait) => !picked.includes(trait.id))

  function add() {
    if (!pending || picked.includes(pending)) return
    setPicked([...picked, pending])
    setPending("")
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className={labelClass}>{label}</p>
        {picked.length > 0 ? (
          <span className="console-label text-muted-foreground/70">
            {picked.length} tagged
          </span>
        ) : null}
      </div>

      {hint ? (
        <p className="text-xs leading-relaxed text-muted-foreground/80">{hint}</p>
      ) : null}

      {error ? (
        <p className="border border-oxide/40 bg-oxide/10 px-3 py-2 text-sm text-oxide">
          Trait glossary unavailable ({error}).
        </p>
      ) : available.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {type.toLowerCase()} traits in the glossary yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="sr-only">Add a {type.toLowerCase()} trait</span>
            <select
              value={pending}
              onChange={(event) => setPending(event.target.value)}
              className={selectClass}
            >
              <option value="">Select a trait…</option>
              {unpicked.map((trait) => (
                <option key={trait.id} value={trait.id}>
                  {trait.name}
                </option>
              ))}
            </select>
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={!pending}
            onClick={add}
            className="rounded-none border-hairline font-heading tracking-[0.12em] uppercase"
          >
            <Plus aria-hidden />
            Tag
          </Button>
        </div>
      )}

      {picked.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {picked.map((id) => {
            const trait = byId.get(id)
            if (!trait) return null
            return (
              <li key={id} className="inline-flex items-center gap-1">
                <TraitBadge
                  tag={{
                    id: trait.id,
                    label: trait.name,
                    description: trait.description,
                    color: trait.color,
                  }}
                />
                <button
                  type="button"
                  aria-label={`Remove ${trait.name}`}
                  onClick={() => setPicked(picked.filter((value) => value !== id))}
                  className="text-muted-foreground transition-colors hover:text-oxide"
                >
                  <X aria-hidden className="size-3" />
                </button>
                <input type="hidden" name="traitId" value={id} />
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
