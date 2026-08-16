import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { GmNote, GmOnlyBadge, RatingMeter } from "@/components/campaign-fields"
import { TraitBadge } from "@/components/trait-badge"
import { getFaction } from "@/lib/api"
import {
  factionTypeLabels,
  partyRelationshipLabels,
  presenceTypeLabels,
  relationshipAccent,
} from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"
import { cn } from "@/lib/utils"

const dataset = getModule("factions")

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getFaction(id)
  if (!result.ok || !result.data) return { title: dataset.title }
  return {
    title: `${result.data.name} · ${dataset.title}`,
    description: result.data.description ?? dataset.synopsis,
  }
}

export default async function FactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, result] = await Promise.all([getCurrentUser(), getFaction(id)])

  if (!result.ok || !result.data) notFound()

  const faction = result.data
  const isGm = user?.role === "admin"

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[
          { label: dataset.code, href: "/factions" },
          { label: faction.name },
        ]}
        title={faction.name}
        lede={faction.description ?? undefined}
        actions={
          isGm ? (
            <Link
              href={`/factions/${id}/edit`}
              className="inline-flex items-center gap-2 border border-oxide/45 bg-oxide/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-oxide transition-colors hover:bg-oxide/20"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Type</p>
          <p className="mt-1 font-heading text-lg tracking-wide uppercase text-oxide">
            {factionTypeLabels[faction.type]}
          </p>
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Reach</p>
          {faction.tier !== null ? (
            <div className="mt-2">
              <RatingMeter label="Tier" value={faction.tier} min={1} />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">Unranked</p>
          )}
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Headquarters</p>
          {faction.headquarters ? (
            <Link
              href={`/systems/${faction.headquarters.id}`}
              className="mt-1 inline-block font-heading text-lg tracking-wide uppercase transition-colors hover:text-signal"
            >
              {faction.headquarters.name}
            </Link>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">No fixed base</p>
          )}
        </div>
      </div>

      {faction.traits.length > 0 ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">Traits</h2>
          <ul className="flex flex-wrap gap-1.5">
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
        </section>
      ) : null}

      {faction.goals ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">Goals</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/85">
            {faction.goals}
          </p>
        </section>
      ) : null}

      {faction.assets.length > 0 ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">Assets</h2>
          <ul className="flex flex-wrap gap-2">
            {faction.assets.map((asset) => (
              <li
                key={asset}
                className="border border-hairline bg-background/30 px-2.5 py-1 font-mono text-xs text-foreground/80"
              >
                {asset}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
            Worlds they control
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {faction.controlledSystems.length}
          </span>
        </div>

        {faction.controlledSystems.length === 0 ? (
          <p className="border border-dashed border-hairline bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground">
            They do not currently hold any hex. Assign a controller from a
            system&apos;s edit form.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {faction.controlledSystems.map((system) => (
              <li
                key={system.id}
                className="flex items-baseline justify-between gap-3 border border-hairline bg-card/60 p-4"
              >
                <Link
                  href={`/systems/${system.id}`}
                  className="font-heading text-base tracking-wide uppercase transition-colors hover:text-signal"
                >
                  {system.name}
                </Link>
                <span className="font-mono text-xs tracking-[0.14em] text-signal">
                  {system.location}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-oxide">
            Where they operate
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {faction.presences.length}
          </span>
        </div>

        {faction.presences.length === 0 ? (
          <p className="border border-dashed border-hairline bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground">
            No presence recorded in any system yet. Add one from a system's
            Relationships tab.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {faction.presences.map((presence) => (
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
                    {presenceTypeLabels[presence.presenceType]}
                  </span>
                  <span
                    className={cn(
                      "console-label",
                      relationshipAccent(presence.relationshipToParty)
                    )}
                  >
                    {partyRelationshipLabels[presence.relationshipToParty]}
                  </span>
                  {presence.visibility === "gm_only" ? <GmOnlyBadge /> : null}
                </div>

                <div className="mt-3">
                  <RatingMeter
                    label="Influence"
                    value={presence.influence}
                    min={1}
                  />
                </div>

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

      {isGm && faction.notes ? <GmNote>{faction.notes}</GmNote> : null}
    </div>
  )
}
