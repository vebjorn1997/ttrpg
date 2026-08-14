import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { GmNote, GmOnlyBadge } from "@/components/campaign-fields"
import { TraitBadge } from "@/components/trait-badge"
import { getCampaignNpc } from "@/lib/api"
import {
  npcConnectionLabels,
  npcStatusLabels,
  riskToleranceLabels,
} from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"
import { cn } from "@/lib/utils"

const dataset = getModule("campaign-npcs")

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getCampaignNpc(id)
  if (!result.ok || !result.data) return { title: dataset.title }
  return {
    title: `${result.data.name} · ${dataset.title}`,
    description: result.data.description ?? dataset.synopsis,
  }
}

export default async function CampaignNpcDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, result] = await Promise.all([
    getCurrentUser(),
    getCampaignNpc(id),
  ])

  if (!result.ok || !result.data) notFound()

  const npc = result.data
  const isGm = user?.role === "admin"

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/campaign-npcs" },
          { label: npc.name },
        ]}
        title={npc.name}
        lede={npc.description ?? undefined}
        actions={
          isGm ? (
            <Link
              href={`/campaign-npcs/${id}/edit`}
              className="inline-flex items-center gap-2 border border-viridian/45 bg-viridian/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-viridian transition-colors hover:bg-viridian/20"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Status</p>
          <p
            className={cn(
              "mt-1 font-heading text-lg tracking-wide uppercase",
              npc.status === "dead" ? "text-oxide" : "text-viridian"
            )}
          >
            {npcStatusLabels[npc.status]}
          </p>
          {npc.upp ? (
            <p className="mt-2 font-mono text-xs tracking-[0.2em] text-muted-foreground">
              UPP {npc.upp}
            </p>
          ) : null}
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Allegiance</p>
          {npc.allegiance ? (
            <Link
              href={`/factions/${npc.allegiance.id}`}
              className="mt-1 inline-block font-heading text-lg tracking-wide uppercase transition-colors hover:text-signal"
            >
              {npc.allegiance.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Unaffiliated</p>
          )}
          {npc.occupation ? (
            <p className="console-label mt-2 text-muted-foreground">
              {npc.occupation}
            </p>
          ) : null}
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Whereabouts</p>
          {npc.currentLocation ? (
            <Link
              href={`/systems/${npc.currentLocation.id}`}
              className="mt-1 inline-block font-heading text-lg tracking-wide uppercase transition-colors hover:text-signal"
            >
              {npc.currentLocation.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Unknown</p>
          )}
        </div>
      </div>

      {npc.traits.length > 0 ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">Traits</h2>
          <ul className="flex flex-wrap gap-1.5">
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
        </section>
      ) : null}

      {npc.description ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">
            Description
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
            {npc.description}
          </p>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-viridian">
            Where they have been
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {npc.presences.length}
          </span>
        </div>

        {npc.presences.length === 0 ? (
          <p className="border border-dashed border-hairline bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No system ties recorded yet. Add one from a system's Relationships
            tab.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {npc.presences.map((presence) => (
              <li
                key={presence.id}
                className="border border-hairline bg-card/60 p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/systems/${presence.system.id}`}
                    className="font-heading text-base tracking-wide uppercase transition-colors hover:text-signal"
                  >
                    {presence.system.name}
                  </Link>
                  <span className="font-mono text-xs tracking-[0.14em] text-signal">
                    {presence.system.location}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="console-label text-muted-foreground">
                    {npcConnectionLabels[presence.connectionType]}
                  </span>
                  {presence.currentStatus ? (
                    <span className="console-label text-muted-foreground">
                      {presence.currentStatus}
                    </span>
                  ) : null}
                  {presence.visibility === "gm_only" ? <GmOnlyBadge /> : null}
                </div>

                {presence.arrivalDate || presence.departureDate ? (
                  <p className="mt-2 font-mono text-xs text-muted-foreground">
                    {presence.arrivalDate ?? "?"} →{" "}
                    {presence.departureDate ?? "present"}
                  </p>
                ) : null}

                {presence.notes ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {presence.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {npc.patronRoles.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline gap-3">
            <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-viridian">
              Patron roles
            </h2>
            <span className="font-mono text-xs text-muted-foreground">
              {npc.patronRoles.length}
            </span>
          </div>

          <ul className="grid gap-3 sm:grid-cols-2">
            {npc.patronRoles.map((role) => (
              <li key={role.id}>
                <Link
                  href={`/patrons/${role.id}`}
                  className="block border border-hairline bg-card/60 p-4 transition-colors hover:border-viridian/50 hover:bg-viridian/5"
                >
                  <p className="font-heading text-base tracking-wide uppercase">
                    Patron record
                  </p>
                  <p className="console-label mt-1 text-muted-foreground">
                    Risk {riskToleranceLabels[role.riskTolerance]}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {isGm && npc.notes ? <GmNote>{npc.notes}</GmNote> : null}
    </div>
  )
}
