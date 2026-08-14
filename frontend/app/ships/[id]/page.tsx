import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { GmNote, GmOnlyBadge } from "@/components/campaign-fields"
import { TraitBadge } from "@/components/trait-badge"
import { getShip } from "@/lib/api"
import {
  shipPurposeLabels,
  shipStatusLabels,
  shipVisitStatusLabels,
} from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"

const dataset = getModule("ships")

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getShip(id)
  if (!result.ok || !result.data) return { title: dataset.title }
  return {
    title: `${result.data.name} · ${dataset.title}`,
    description: result.data.type ?? dataset.synopsis,
  }
}

export default async function ShipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, result] = await Promise.all([getCurrentUser(), getShip(id)])

  if (!result.ok || !result.data) notFound()

  const ship = result.data
  const isGm = user?.role === "admin"
  const owner = ship.ownerFaction ?? ship.ownerNpc
  const ownerHref = ship.ownerFaction
    ? `/factions/${ship.ownerFaction.id}`
    : ship.ownerNpc
      ? `/campaign-npcs/${ship.ownerNpc.id}`
      : null
  const lede = [ship.type, ship.registration].filter(Boolean).join(" · ")

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[{ label: dataset.code, href: "/ships" }, { label: ship.name }]}
        title={ship.name}
        lede={lede || undefined}
        actions={
          isGm ? (
            <Link
              href={`/ships/${id}/edit`}
              className="inline-flex items-center gap-2 border border-signal/45 bg-signal/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-signal transition-colors hover:bg-signal/20"
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
          <p className="mt-1 font-heading text-lg tracking-wide uppercase text-signal">
            {shipStatusLabels[ship.status]}
          </p>
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Owner</p>
          {owner && ownerHref ? (
            <Link
              href={ownerHref}
              className="mt-1 inline-block font-heading text-lg tracking-wide uppercase transition-colors hover:text-signal"
            >
              {owner.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Unclaimed</p>
          )}
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">
            Last known position
          </p>
          {ship.currentSystem ? (
            <Link
              href={`/systems/${ship.currentSystem.id}`}
              className="mt-1 inline-block font-heading text-lg tracking-wide uppercase transition-colors hover:text-signal"
            >
              {ship.currentSystem.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              Whereabouts unknown
            </p>
          )}
        </div>
      </div>

      {ship.traits.length > 0 ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">Traits</h2>
          <ul className="flex flex-wrap gap-1.5">
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
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-signal">
            Port calls
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {ship.visits.length}
          </span>
        </div>

        {ship.visits.length === 0 ? (
          <p className="border border-dashed border-hairline bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No port calls logged for this ship.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {ship.visits.map((visit) => (
              <li key={visit.id} className="border border-hairline bg-card/60 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/systems/${visit.system.id}`}
                    className="font-heading text-base tracking-wide uppercase transition-colors hover:text-signal"
                  >
                    {visit.system.name}
                  </Link>
                  <span className="font-mono text-xs tracking-[0.14em] text-signal">
                    {visit.system.location}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="console-label text-muted-foreground">
                    {shipVisitStatusLabels[visit.status]}
                  </span>
                  {visit.purpose ? (
                    <span className="console-label text-muted-foreground">
                      {shipPurposeLabels[visit.purpose]}
                    </span>
                  ) : null}
                  {visit.visibility === "gm_only" ? <GmOnlyBadge /> : null}
                </div>

                {visit.arrivalDate || visit.departureDate ? (
                  <p className="mt-3 font-mono text-xs text-muted-foreground">
                    {visit.arrivalDate ?? "?"} →{" "}
                    {visit.departureDate ?? "still here"}
                  </p>
                ) : null}

                {visit.notes ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {visit.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isGm && ship.notes ? <GmNote>{ship.notes}</GmNote> : null}
    </div>
  )
}
