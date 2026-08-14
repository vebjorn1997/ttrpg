import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { GmOnlyBadge } from "@/components/campaign-fields"
import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { TraitBadge } from "@/components/trait-badge"
import { getCampaignNpcs } from "@/lib/api"
import { npcStatusLabels } from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"
import { cn } from "@/lib/utils"

const dataset = getModule("campaign-npcs")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function CampaignNpcsPage() {
  const [user, result] = await Promise.all([
    getCurrentUser(),
    getCampaignNpcs(),
  ])
  const npcs = result.data ?? []
  const isGm = user?.role === "admin"

  return (
    <div className="space-y-6">
      <PageHeader module={dataset} count={result.ok ? npcs.length : null} />

      {isGm ? (
        <div className="flex justify-end">
          <Link
            href="/campaign-npcs/new"
            className="inline-flex items-center gap-2 border border-viridian/45 bg-viridian/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-viridian transition-colors hover:bg-viridian/20"
          >
            <Plus aria-hidden className="size-3.5" />
            New character
          </Link>
        </div>
      ) : null}

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : npcs.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            No characters on file
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            This is where the named people of the campaign live — the ones the
            crew argues with, works for and avoids. The stat blocks you roll
            against sit in the NPC catalog at /npcs instead.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {npcs.map((npc) => (
            <li
              key={npc.id}
              className={cn(
                "group relative h-full border border-hairline bg-card/60 p-4 transition-colors hover:border-viridian/50 hover:bg-viridian/5",
                npc.status === "dead" && "opacity-70"
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-lg tracking-wide uppercase group-hover:text-viridian">
                  {/* Stretched link: the whole card is the target, but the trait
                      badges below stay separately clickable. */}
                  <Link
                    href={`/campaign-npcs/${npc.id}`}
                    className="after:absolute after:inset-0 after:content-['']"
                  >
                    {npc.name}
                  </Link>
                </h2>
                <span
                  className={cn(
                    "console-label",
                    npc.status === "dead"
                      ? "text-oxide"
                      : "text-muted-foreground"
                  )}
                >
                  {npcStatusLabels[npc.status]}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                {npc.occupation ? (
                  <span className="console-label text-muted-foreground">
                    {npc.occupation}
                  </span>
                ) : null}
                {isGm && npc.notes ? <GmOnlyBadge /> : null}
              </div>

              {npc.currentLocation ? (
                <p className="console-label mt-2 text-muted-foreground">
                  At {npc.currentLocation.name} · {npc.currentLocation.location}
                </p>
              ) : null}

              {npc.allegiance ? (
                <p className="console-label mt-2 text-muted-foreground">
                  Serves {npc.allegiance.name}
                </p>
              ) : null}

              {npc.description ? (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {npc.description}
                </p>
              ) : null}

              {npc.traits.length > 0 ? (
                <ul className="relative z-10 mt-3 flex flex-wrap gap-1.5">
                  {npc.traits.map((trait) => (
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
