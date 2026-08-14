import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"
import { Download, Plus, Upload } from "lucide-react"

import { GmOnlyBadge } from "@/components/campaign-fields"
import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { SystemFilterBar } from "@/components/system-filter-bar"
import { TraitBadge } from "@/components/trait-badge"
import { getLawLevels, getSystems, getTechLevels, getTraits } from "@/lib/api"
import type { SystemFilters } from "@/lib/api-types"
import { accentClasses, getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"
import { cn } from "@/lib/utils"

const dataset = getModule("systems")
const tone = accentClasses[dataset.accent]

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

type SearchParams = Record<string, string | string[] | undefined>

function first(params: SearchParams, key: string): string | undefined {
  const value = params[key]
  return Array.isArray(value) ? value[0] : value
}

function number(params: SearchParams, key: string): number | undefined {
  const raw = first(params, key)
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isInteger(value) ? value : undefined
}

function toFilters(params: SearchParams): SystemFilters {
  const traits = params.trait
  return {
    search: first(params, "search"),
    tlMin: number(params, "tlMin"),
    tlMax: number(params, "tlMax"),
    lawMin: number(params, "lawMin"),
    lawMax: number(params, "lawMax"),
    location: first(params, "location"),
    travelZone: first(params, "zone"),
    traits: Array.isArray(traits) ? traits : traits ? [traits] : undefined,
  }
}

const actionLink = cn(
  "inline-flex items-center gap-2 border px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase transition-colors",
  tone.border,
  tone.bg,
  tone.text,
  "hover:bg-signal/20"
)

export default async function SystemsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const filters = toFilters(params)

  const [user, result, techLevels, lawLevels, traits] = await Promise.all([
    getCurrentUser(),
    getSystems(filters),
    getTechLevels(),
    getLawLevels(),
    getTraits(),
  ])

  const systems = result.data ?? []
  const isGm = user?.role === "admin"
  const systemTraits = (traits.data ?? []).filter(
    (trait) => trait.type.toLowerCase() === "system"
  )
  const filtered = Object.values(filters).some((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined && value !== ""
  )

  return (
    <div className="space-y-6">
      <PageHeader module={dataset} count={result.ok ? systems.length : null} />

      {isGm ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Link href="/systems/import" className={actionLink}>
            <Upload aria-hidden className="size-3.5" />
            Import CSV
          </Link>
          <a href="/api/systems/export" className={actionLink} download>
            <Download aria-hidden className="size-3.5" />
            Export JSON
          </a>
          <Link href="/systems/new" className={actionLink}>
            <Plus aria-hidden className="size-3.5" />
            New system
          </Link>
        </div>
      ) : null}

      <Suspense
        fallback={
          <div className="h-48 border border-hairline bg-card/50" aria-hidden />
        }
      >
        <SystemFilterBar
          techLevels={techLevels.data ?? []}
          lawLevels={lawLevels.data ?? []}
          systemTraits={systemTraits}
        />
      </Suspense>

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : systems.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            {filtered ? "No systems match" : "No systems charted"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {filtered
              ? "Widen the filters, or clear them to see the whole subsector."
              : "Chart the first world to start building out the sector."}
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {systems.map((system) => (
            <li
              key={system.id}
              className="group relative h-full border border-hairline bg-card/60 p-4 transition-colors hover:border-signal/50 hover:bg-signal/5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg tracking-wide uppercase group-hover:text-signal">
                  {/* Stretched link: the whole card is the target, but the trait
                      badges below stay separately clickable. */}
                  <Link
                    href={`/systems/${system.id}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {system.name}
                  </Link>
                </h2>
                <span className="font-mono text-sm tracking-[0.18em] text-signal">
                  {system.location}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="console-label text-muted-foreground">
                  TL {system.techLevel}
                  {system.techLevelName ? ` · ${system.techLevelName}` : ""}
                </span>
                <span className="console-label text-muted-foreground">
                  Law {system.lawLevel}
                  {system.lawLevelName ? ` · ${system.lawLevelName}` : ""}
                </span>
                {isGm && system.notes ? <GmOnlyBadge /> : null}
              </div>

              {system.description ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {system.description}
                </p>
              ) : null}

              {system.traits.length > 0 ? (
                <ul className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  {system.traits.map((trait) => (
                    <li key={trait.id}>
                      <TraitBadge
                        tag={{
                          id: trait.id,
                          label: trait.name,
                          description: trait.description,
                          color: trait.color,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
