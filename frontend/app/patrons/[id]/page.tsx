import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Pencil } from "lucide-react"

import { CampaignCrumbs } from "@/components/campaign-crumbs"
import { GmNote, GmOnlyBadge } from "@/components/campaign-fields"
import { PatronReputation } from "@/components/patron-reputation"
import { getPatron } from "@/lib/api"
import {
  jobDifficultyLabels,
  legalStatusLabels,
  patronAvailabilityLabels,
  paymentRecordLabels,
  riskToleranceLabels,
} from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"

const dataset = getModule("patrons")

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const result = await getPatron(id)
  if (!result.ok || !result.data) return { title: dataset.title }
  const name = result.data.npc?.name ?? "Unnamed patron"
  return {
    title: `${name} · ${dataset.title}`,
    description: result.data.npc?.description ?? dataset.synopsis,
  }
}

export default async function PatronDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [user, result] = await Promise.all([getCurrentUser(), getPatron(id)])

  if (!result.ok || !result.data) notFound()

  const patron = result.data
  const isGm = user?.role === "admin"
  const name = patron.npc?.name ?? "Unnamed patron"

  return (
    <div className="space-y-6">
      <CampaignCrumbs
        crumbs={[{ label: dataset.code, href: "/patrons" }, { label: name }]}
        title={name}
        lede={patron.npc?.description ?? undefined}
        actions={
          isGm ? (
            <Link
              href={`/patrons/${id}/edit`}
              className="inline-flex items-center gap-2 border border-ochre/45 bg-ochre/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-ochre transition-colors hover:bg-ochre/20"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </Link>
          ) : null
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Reputation</p>
          <div className="mt-2">
            <PatronReputation value={patron.reputation} />
          </div>
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Payment record</p>
          <p className="mt-1 font-heading text-lg tracking-wide uppercase text-ochre">
            {paymentRecordLabels[patron.paymentRecord]}
          </p>
        </div>
        <div className="border border-hairline bg-card/50 p-4">
          <p className="console-label text-muted-foreground">Risk tolerance</p>
          <p className="mt-1 font-heading text-lg tracking-wide uppercase text-ochre">
            {riskToleranceLabels[patron.riskTolerance]}
          </p>
        </div>
      </div>

      {patron.npc ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">
            Who this is
          </h2>
          <Link
            href={`/campaign-npcs/${patron.npcId}`}
            className="font-heading text-lg tracking-wide uppercase transition-colors hover:text-signal"
          >
            {patron.npc.name}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
            {patron.npc.occupation ? (
              <span className="console-label text-muted-foreground">
                {patron.npc.occupation}
              </span>
            ) : null}
            {patron.npc.currentLocation ? (
              <span className="console-label text-muted-foreground">
                Last seen at {patron.npc.currentLocation.name} ·{" "}
                {patron.npc.currentLocation.location}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      {patron.jobTypes.length > 0 ? (
        <section className="border border-hairline bg-card/50 p-5">
          <h2 className="console-label mb-3 text-muted-foreground">
            Job types
          </h2>
          <ul className="flex flex-wrap gap-2">
            {patron.jobTypes.map((job) => (
              <li
                key={job}
                className="border border-hairline bg-background/30 px-2.5 py-1 font-mono text-xs text-foreground/80"
              >
                {job}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-baseline gap-3">
          <h2 className="font-heading text-sm tracking-[0.16em] uppercase text-ochre">
            Work on offer
          </h2>
          <span className="font-mono text-xs text-muted-foreground">
            {patron.offers.length}
          </span>
        </div>

        {patron.offers.length === 0 ? (
          <p className="border border-dashed border-hairline bg-card/30 px-4 py-6 text-center text-sm text-muted-foreground">
            This patron is not offering work anywhere right now.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {patron.offers.map((offer) => (
              <li
                key={offer.id}
                className="border border-hairline bg-card/60 p-4"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/systems/${offer.system.id}`}
                    className="font-heading text-base tracking-wide uppercase transition-colors hover:text-signal"
                  >
                    {offer.system.name}
                  </Link>
                  <span className="font-mono text-xs tracking-[0.14em] text-signal">
                    {offer.system.location}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="console-label text-muted-foreground">
                    {patronAvailabilityLabels[offer.availability]}
                  </span>
                  {offer.difficulty ? (
                    <span className="console-label text-muted-foreground">
                      {jobDifficultyLabels[offer.difficulty]}
                    </span>
                  ) : null}
                  {offer.legalStatus ? (
                    <span
                      className={
                        offer.legalStatus === "illegal"
                          ? "console-label text-oxide"
                          : "console-label text-muted-foreground"
                      }
                    >
                      {legalStatusLabels[offer.legalStatus]}
                    </span>
                  ) : null}
                  {offer.visibility === "gm_only" ? <GmOnlyBadge /> : null}
                </div>

                {offer.jobSummary ? (
                  <p className="mt-3 text-sm leading-relaxed text-foreground/85">
                    {offer.jobSummary}
                  </p>
                ) : null}

                {offer.reward ? (
                  <p className="mt-3 font-mono text-xs text-ochre">
                    {offer.reward}
                  </p>
                ) : null}

                {offer.notes ? (
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {offer.notes}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {isGm && patron.notes ? <GmNote>{patron.notes}</GmNote> : null}
    </div>
  )
}
