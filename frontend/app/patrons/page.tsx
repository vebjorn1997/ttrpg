import type { Metadata } from "next"
import Link from "next/link"
import { Plus } from "lucide-react"

import { GmOnlyBadge } from "@/components/campaign-fields"
import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { PatronReputation } from "@/components/patron-reputation"
import { getPatrons } from "@/lib/api"
import { paymentRecordLabels, riskToleranceLabels } from "@/lib/campaign"
import { getModule } from "@/lib/modules"
import { getCurrentUser } from "@/lib/session"

const dataset = getModule("patrons")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function PatronsPage() {
  const [user, result] = await Promise.all([getCurrentUser(), getPatrons()])
  const patrons = result.data ?? []
  const isGm = user?.role === "admin"

  return (
    <div className="space-y-6">
      <PageHeader module={dataset} count={result.ok ? patrons.length : null} />

      {isGm ? (
        <div className="flex justify-end">
          <Link
            href="/patrons/new"
            className="inline-flex items-center gap-2 border border-ochre/45 bg-ochre/10 px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase text-ochre transition-colors hover:bg-ochre/20"
          >
            <Plus aria-hidden className="size-3.5" />
            New patron
          </Link>
        </div>
      ) : null}

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : patrons.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            No patrons on file
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            A patron is a character from the Cast in a hiring role. File
            somebody there first, then record what they pay and what they ask
            for.
          </p>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {patrons.map((patron) => (
            <li key={patron.id}>
              <Link
                href={`/patrons/${patron.id}`}
                className="group block h-full border border-hairline bg-card/60 p-4 transition-colors hover:border-ochre/50 hover:bg-ochre/5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-heading text-lg tracking-wide uppercase group-hover:text-ochre">
                    {patron.npc?.name ?? "Unnamed patron"}
                  </h2>
                  <PatronReputation value={patron.reputation} />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  {patron.npc?.occupation ? (
                    <span className="console-label text-muted-foreground">
                      {patron.npc.occupation}
                    </span>
                  ) : null}
                  <span className="console-label text-muted-foreground">
                    Pays {paymentRecordLabels[patron.paymentRecord]}
                  </span>
                  <span className="console-label text-muted-foreground">
                    Risk {riskToleranceLabels[patron.riskTolerance]}
                  </span>
                  {isGm && patron.notes ? <GmOnlyBadge /> : null}
                </div>

                {patron.jobTypes.length > 0 ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {patron.jobTypes.map((job) => (
                      <li
                        key={job}
                        className="border border-hairline bg-background/30 px-2.5 py-1 font-mono text-xs text-foreground/80"
                      >
                        {job}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
