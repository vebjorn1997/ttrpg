import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { GmOnlyBadge } from "@/components/campaign-fields"
import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { TraitBadge } from "@/components/trait-badge"
import { getShips } from "@/lib/api"
import { shipStatusLabels } from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"
import { cn } from "@/lib/utils"

const dataset = getModule("ships")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function ShipsPage() {
  const [user, result] = await Promise.all([getCurrentUser(), getShips()])
  const ships = result.data ?? []
  const isGm = user?.role === "admin"

  return (
    <div className="space-y-6">
      <PageHeader module={dataset} count={result.ok ? ships.length : null} />

      {isGm ? (
        <div className="flex justify-end">
          <Link
            href="/ships/new"
            className="inline-flex items-center gap-2 border border-signal/45 bg-signal/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal/20"
          >
            <Plus aria-hidden className="size-3.5" />
            New ship
          </Link>
        </div>
      ) : null}

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : ships.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            No ships on file
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is the registry of named hulls the crew has encountered. Add
            one once a ship is worth remembering.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {ships.map((ship) => (
            <li
              key={ship.id}
              className={cn(
                "group relative h-full border border-hairline bg-card/60 p-4 transition-colors hover:border-signal/50 hover:bg-signal/5",
                ship.status === "destroyed" && "opacity-70"
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg tracking-wide uppercase group-hover:text-signal">
                  {/* Stretched link: the whole card is the target, but the trait
                      badges below stay separately clickable. */}
                  <Link
                    href={`/ships/${ship.id}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {ship.name}
                  </Link>
                </h2>
                {ship.registration ? (
                  <span className="font-mono text-xs tracking-[0.14em] text-muted-foreground">
                    {ship.registration}
                  </span>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span
                  className={cn(
                    "console-label",
                    ship.status === "destroyed"
                      ? "text-oxide"
                      : "text-muted-foreground"
                  )}
                >
                  {shipStatusLabels[ship.status]}
                </span>
                {ship.type ? (
                  <span className="console-label text-muted-foreground">
                    {ship.type}
                  </span>
                ) : null}
                {isGm && ship.notes ? <GmOnlyBadge /> : null}
              </div>

              {ship.ownerFaction || ship.ownerNpc ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  Owned by {ship.ownerFaction?.name ?? ship.ownerNpc?.name}
                </p>
              ) : null}

              {ship.currentSystem ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  At {ship.currentSystem.name} · {ship.currentSystem.location}
                </p>
              ) : null}

              {ship.traits.length > 0 ? (
                <ul className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  {ship.traits.map((trait) => (
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
