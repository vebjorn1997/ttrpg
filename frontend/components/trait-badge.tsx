"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { RecordTag } from "@/lib/records"
import { cn } from "@/lib/utils"

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/**
 * Trait colours in the database are deep oxblood tones that would vanish on a
 * dark panel, so the raw hex is only used as a mixing base: lightened for the
 * border, thinned for the fill.
 */
function toneFor(color: string | null | undefined) {
  if (!color || !HEX.test(color)) return undefined

  return {
    borderColor: `color-mix(in oklab, ${color}, oklch(0.9 0.03 85) 55%)`,
    backgroundColor: `color-mix(in oklab, ${color}, transparent 40%)`,
  }
}

export function TraitBadge({
  tag,
  className,
}: {
  tag: RecordTag
  className?: string
}) {
  const href = tag.id
    ? `/traits?id=${encodeURIComponent(tag.id)}`
    : undefined

  const badge = (
    <Badge
      variant="outline"
      style={toneFor(tag.color)}
      className={cn(
        "h-5 rounded-none border font-mono text-[0.65rem] tracking-[0.14em] uppercase",
        href && "transition-colors hover:border-viridian/70 hover:text-viridian",
        className
      )}
    >
      {tag.label}
    </Badge>
  )

  const linked = href ? (
    <Link href={href} className="inline-flex" onClick={(event) => event.stopPropagation()}>
      {badge}
    </Link>
  ) : (
    badge
  )

  if (!tag.description) return linked

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="cursor-help" />}
        aria-label={`${tag.label}: ${tag.description}`}
      >
        {linked}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs rounded-none text-left leading-relaxed">
        <span>
          <span className="font-mono tracking-[0.14em] uppercase">
            {tag.label}
          </span>
          {" — "}
          {tag.description}
        </span>
      </TooltipContent>
    </Tooltip>
  )
}
