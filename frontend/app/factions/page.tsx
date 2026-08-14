import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { GmOnlyBadge, RatingMeter } from "@/components/campaign-fields"
import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { TraitBadge } from "@/components/trait-badge"
import { getFactions } from "@/lib/api"
import { factionTypeLabels } from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"

const dataset = getModule("factions")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function FactionsPage() {
  const [user, result] = await Promise.all([getCurrentUser(), getFactions()])
  const factions = result.data ?? []
  const isGm = user?.role === "admin"

  return (
    <div className="space-y-6">
      <PageHeader module={dataset} count={result.ok ? factions.length : null} />

      {isGm ? (
        <div className="flex justify-end">
          <Link
            href="/factions/new"
            className="inline-flex items-center gap-2 border border-oxide/45 bg-oxide/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-oxide transition-colors hover:bg-oxide/20"
          >
            <Plus aria-hidden className="size-3.5" />
            New faction
          </Link>
        </div>
      ) : null}

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : factions.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            No factions on file
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Governments, corporations, cults and gangs all live here. Add one to
            start wiring it into systems.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {factions.map((faction) => (
            <li
              key={faction.id}
              className="group relative h-full border border-hairline bg-card/60 p-4 transition-colors hover:border-oxide/50 hover:bg-oxide/5"
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg tracking-wide uppercase group-hover:text-oxide">
                  {/* Stretched link: the whole card is the target, but the trait
                      badges below stay separately clickable. */}
                  <Link
                    href={`/factions/${faction.id}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {faction.name}
                  </Link>
                </h2>
                <span className="console-label text-muted-foreground">
                  {factionTypeLabels[faction.type]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {faction.headquarters ? (
                  <span className="console-label text-muted-foreground">
                    Based at {faction.headquarters.name} ·{" "}
                    {faction.headquarters.location}
                  </span>
                ) : null}
                {isGm && faction.notes ? <GmOnlyBadge /> : null}
              </div>

              {faction.tier !== null ? (
                <div className="mt-3">
                  <RatingMeter label="Tier" value={faction.tier} min={1} />
                </div>
              ) : null}

              {faction.description ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {faction.description}
                </p>
              ) : null}

              {faction.traits.length > 0 ? (
                <ul className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  {faction.traits.map((trait) => (
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
