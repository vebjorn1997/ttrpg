"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { Search, X } from "lucide-react"

import { fieldClass, labelClass, selectClass } from "@/components/campaign-fields"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { LawLevel, TechLevel, Trait } from "@/lib/api-types"
import { cn } from "@/lib/utils"

const TRAVEL_ZONES = ["Amber Zone", "Red Zone"] as const

const DEBOUNCE_MS = 350

/**
 * Pushes a text box's value into the URL once typing pauses, skipping the write
 * when the value already matches so the effect cannot loop against itself.
 */
function useDebouncedParam(
  key: string,
  value: string,
  current: string,
  setSingle: (key: string, value: string) => void
) {
  useEffect(() => {
    const trimmed = value.trim()
    if (trimmed === current) return

    const timer = setTimeout(() => setSingle(key, trimmed), DEBOUNCE_MS)
    return () => clearTimeout(timer)
    // `setSingle` is redefined every render; the value comparison above is what
    // actually guards re-entry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, value, current])
}

type SystemFilterBarProps = {
  techLevels: TechLevel[]
  lawLevels: LawLevel[]
  systemTraits: Trait[]
}

/**
 * Filters are held in the URL so a filtered view of the subsector can be
 * bookmarked and handed to the table.
 */
export function SystemFilterBar({
  techLevels,
  lawLevels,
  systemTraits,
}: SystemFilterBarProps) {
  const router = useRouter()
  const params = useSearchParams()
  const [pending, startTransition] = useTransition()

  const searchParam = params.get("search") ?? ""
  const locationParam = params.get("location") ?? ""
  const [search, setSearch] = useState(searchParam)
  const [location, setLocation] = useState(locationParam)

  const selectedTraits = params.getAll("trait")
  const zone = params.get("zone") ?? ""

  const paramsRef = useRef(params)
  paramsRef.current = params

  function apply(mutate: (next: URLSearchParams) => void) {
    const next = new URLSearchParams(paramsRef.current.toString())
    mutate(next)
    startTransition(() => {
      const query = next.toString()
      router.replace(query ? `/systems?${query}` : "/systems", { scroll: false })
    })
  }

  function setSingle(key: string, value: string) {
    apply((next) => {
      if (value) next.set(key, value)
      else next.delete(key)
    })
  }

  // Clearing filters rewrites the URL; pull the text boxes back in step with it.
  useEffect(() => setSearch(searchParam), [searchParam])
  useEffect(() => setLocation(locationParam), [locationParam])

  // The free-text boxes filter as you type, one pause later, so the URL is not
  // rewritten on every keystroke.
  useDebouncedParam("search", search, searchParam, setSingle)
  useDebouncedParam("location", location, locationParam, setSingle)

  function toggleTrait(name: string) {
    apply((next) => {
      const current = next.getAll("trait")
      next.delete("trait")
      const remaining = current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name]
      for (const item of remaining) next.append("trait", item)
    })
  }

  const zoneTraits = systemTraits.filter((trait) =>
    (TRAVEL_ZONES as readonly string[]).includes(trait.name)
  )
  const tagTraits = systemTraits.filter(
    (trait) => !(TRAVEL_ZONES as readonly string[]).includes(trait.name)
  )

  const hasFilters = [...params.keys()].length > 0

  return (
    <div
      className={cn(
        "space-y-4 border border-hairline bg-card/50 p-4 transition-opacity",
        pending && "opacity-60"
      )}
    >
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5 md:col-span-2">
          <span className={labelClass}>Search</span>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              placeholder="Name or description…"
              onChange={(event) => setSearch(event.target.value)}
              className={cn(fieldClass, "pl-8")}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Travel zone</span>
          <select
            value={zone}
            onChange={(event) => setSingle("zone", event.target.value)}
            className={selectClass}
          >
            <option value="">Any zone</option>
            <option value="green">Green — unrestricted</option>
            {zoneTraits.map((trait) => (
              <option key={trait.id} value={trait.name}>
                {trait.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Hex</span>
          <Input
            value={location}
            placeholder="1910"
            maxLength={4}
            onChange={(event) =>
              setLocation(event.target.value.trim().toUpperCase())
            }
            className={cn(fieldClass, "uppercase")}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Tech level min</span>
          <select
            value={params.get("tlMin") ?? ""}
            onChange={(event) => setSingle("tlMin", event.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {techLevels.map((tl) => (
              <option key={tl.id} value={tl.level}>
                {tl.level} — {tl.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Tech level max</span>
          <select
            value={params.get("tlMax") ?? ""}
            onChange={(event) => setSingle("tlMax", event.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {techLevels.map((tl) => (
              <option key={tl.id} value={tl.level}>
                {tl.level} — {tl.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Law level min</span>
          <select
            value={params.get("lawMin") ?? ""}
            onChange={(event) => setSingle("lawMin", event.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {lawLevels.map((law) => (
              <option key={law.id} value={law.lawlevel}>
                {law.lawlevel} — {law.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className={labelClass}>Law level max</span>
          <select
            value={params.get("lawMax") ?? ""}
            onChange={(event) => setSingle("lawMax", event.target.value)}
            className={selectClass}
          >
            <option value="">Any</option>
            {lawLevels.map((law) => (
              <option key={law.id} value={law.lawlevel}>
                {law.lawlevel} — {law.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {tagTraits.length > 0 ? (
        <div className="space-y-2">
          <p className={labelClass}>Traits</p>
          <div className="flex flex-wrap gap-1.5">
            {tagTraits.map((trait) => {
              const active = selectedTraits.includes(trait.name)
              return (
                <button
                  key={trait.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleTrait(trait.name)}
                  className={cn(
                    "border px-2 py-1 font-mono text-[0.65rem] tracking-[0.14em] uppercase transition-colors",
                    active
                      ? "border-viridian/70 bg-viridian/15 text-viridian"
                      : "border-hairline text-muted-foreground hover:border-viridian/40 hover:text-foreground/80"
                  )}
                >
                  {trait.name}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      {hasFilters ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("")
              setLocation("")
              startTransition(() => router.replace("/systems", { scroll: false }))
            }}
            className="rounded-none font-heading text-xs tracking-[0.12em] uppercase text-muted-foreground hover:text-oxide"
          >
            <X aria-hidden />
            Clear filters
          </Button>
        </div>
      ) : null}
    </div>
  )
}
