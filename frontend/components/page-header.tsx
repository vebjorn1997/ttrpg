import Link from "next/link"
import { ChevronRight, ExternalLink } from "lucide-react"

import { CornerBrackets } from "@/components/corner-brackets"
import { API_BASE_URL } from "@/lib/api"
import { accentClasses, type DataModule } from "@/lib/modules"
import { cn } from "@/lib/utils"

/** Title block for a dataset page — teaching blurb first, raw JSON tucked away. */
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
    <section className="relative border border-hairline bg-card/50 p-5 sm:p-6">
      <CornerBrackets />

      <nav
        aria-label="Breadcrumb"
        className="console-label flex items-center gap-1.5 text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-ochre">
          Field manual
        </Link>
        <ChevronRight aria-hidden className="size-3" />
        <span className={tone.text}>{module.code}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        <div className="flex min-w-0 flex-1 items-start gap-4">
          <span
            className={cn(
              "flex size-10 shrink-0 items-center justify-center border",
              tone.border,
              tone.bg
            )}
          >
            <Icon className={cn("size-5", tone.text)} />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="font-heading text-2xl leading-tight font-semibold tracking-wide uppercase sm:text-3xl">
                {module.title}
              </h1>
              <span className="console-label text-muted-foreground">
                {count === null
                  ? "––"
                  : `${String(count).padStart(2, "0")} ${module.units}`}
              </span>
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-foreground/75">
              {module.detail}
            </p>
          </div>
        </div>

        <a
          href={`${API_BASE_URL}${module.endpoint}`}
          target="_blank"
          rel="noreferrer"
          className="console-label inline-flex shrink-0 items-center gap-1.5 self-start text-muted-foreground/70 transition-colors hover:text-ochre sm:self-end"
        >
          Raw JSON
          <ExternalLink aria-hidden className="size-3" />
        </a>
      </div>
    </section>
  )
}
