import type { Metadata } from "next"
import Link from "next/link"
import { List } from "lucide-react"

import { OfflineNotice } from "@/components/offline-notice"
import { SystemsMap } from "@/components/systems-map"
import { getSystems } from "@/lib/api"
import { accentClasses, getModule } from "@/lib/modules"
import { cn } from "@/lib/utils"

const dataset = getModule("systems")
const tone = accentClasses[dataset.accent]

export const metadata: Metadata = {
  title: `Hex Map · ${dataset.title}`,
  description: "Charted worlds on the campaign hex grid.",
}

const actionLink = cn(
  "inline-flex items-center gap-2 border px-3 py-2 font-heading text-xs tracking-[0.14em] uppercase transition-colors",
  tone.border,
  tone.bg,
  tone.text,
  "hover:bg-signal/20"
)

export default async function SystemsMapPage() {
  const result = await getSystems()
  const systems = result.data ?? []

  return (
    <div className="flex h-[calc(100dvh-10.5rem)] flex-col gap-3 overflow-hidden sm:h-[calc(100dvh-11.5rem)]">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border border-hairline bg-card/50 px-4 py-3">
        <div className="min-w-0">
          <nav
            aria-label="Breadcrumb"
            className="console-label flex items-center gap-1.5 text-muted-foreground"
          >
            <Link href="/" className="transition-colors hover:text-ochre">
              Field manual
            </Link>
            <span aria-hidden>/</span>
            <Link href="/systems" className="transition-colors hover:text-ochre">
              {dataset.code}
            </Link>
            <span aria-hidden>/</span>
            <span className={tone.text}>MAP</span>
          </nav>
          <h1 className="mt-1 font-heading text-lg tracking-wide uppercase sm:text-xl">
            Hex map
          </h1>
        </div>
        <Link href="/systems" className={actionLink}>
          <List aria-hidden className="size-3.5" />
          Registry list
        </Link>
      </header>

      {result.error ? (
        <OfflineNotice error={result.error} endpoint={dataset.endpoint} />
      ) : systems.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-6 py-12 text-center">
          <p className="font-heading text-lg tracking-wide uppercase">
            No systems charted
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a world with a hex location to see it on the chart.
          </p>
        </div>
      ) : (
        <div className="min-h-0 flex-1">
          <SystemsMap systems={systems} />
        </div>
      )}
    </div>
  )
}
