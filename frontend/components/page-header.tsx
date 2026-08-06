import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"

import { CornerBrackets } from "@/components/corner-brackets"
import { API_BASE_URL } from "@/lib/api"
import { accentClasses, type DataModule } from "@/lib/modules"
import { cn } from "@/lib/utils"

/** Title block for a dataset page, including a link to its raw JSON. */
export function PageHeader({
  module,
  count,
}: {
  module: DataModule
  count: number | null
}) {
  const Icon = module.icon
  const tone = accentClasses[module.accent]

  return (
    <section className="relative border border-hairline bg-card/60 p-5 sm:p-6">
      <CornerBrackets />

      <nav
        aria-label="Breadcrumb"
        className="console-label flex items-center gap-1.5 text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-ochre">
          Dashboard
        </Link>
        <ChevronRight aria-hidden className="size-3" />
        <span className={tone.text}>{module.code}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            className={cn(
              "flex size-11 shrink-0 items-center justify-center border",
              tone.border,
              tone.bg
            )}
          >
            <Icon className={cn("size-5", tone.text)} />
          </span>

          <div className="min-w-0">
            <h1 className="font-heading text-2xl leading-tight font-semibold tracking-wide uppercase sm:text-3xl">
              {module.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {module.detail}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
          <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-1.5">
            <span className={cn("font-mono text-3xl leading-none", tone.text)}>
              {count === null ? "––" : String(count).padStart(2, "0")}
            </span>
            <span className="console-label text-muted-foreground">
              {module.units} on record
            </span>
          </div>
          <a
            href={`${API_BASE_URL}${module.endpoint}`}
            target="_blank"
            rel="noreferrer"
            className="console-label inline-flex items-center gap-1.5 border border-hairline px-2 py-1 text-muted-foreground transition-colors hover:border-ochre/45 hover:text-ochre"
          >
            GET {module.endpoint}
            <ExternalLink aria-hidden className="size-3" />
          </a>
        </div>
      </div>
    </section>
  )
}
