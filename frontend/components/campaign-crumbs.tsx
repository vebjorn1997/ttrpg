import Link from "next/link"
import type { ReactNode } from "react"
import { ChevronRight } from "lucide-react"

import { CornerBrackets } from "@/components/corner-brackets"

type Crumb = { label: string; href?: string }

/**
 * Breadcrumb + title slab used by the campaign world pages, matching the
 * console header on the character sheets.
 */
export function CampaignCrumbs({
  crumbs,
  title,
  lede,
  actions,
}: {
  crumbs: Crumb[]
  title: string
  lede?: string
  actions?: ReactNode
}) {
  return (
    <section className="relative border border-hairline bg-card/50 p-5 sm:p-6">
      <CornerBrackets />
      <nav
        aria-label="Breadcrumb"
        className="console-label flex flex-wrap items-center gap-1.5 text-muted-foreground"
      >
        <Link href="/" className="transition-colors hover:text-signal">
          Field manual
        </Link>
        {crumbs.map((crumb) => (
          <span key={crumb.label} className="flex items-center gap-1.5">
            <ChevronRight aria-hidden className="size-3" />
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="transition-colors hover:text-signal"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="text-signal">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-wide uppercase sm:text-3xl">
            {title}
          </h1>
          {lede ? (
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-foreground/75">
              {lede}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </section>
  )
}
