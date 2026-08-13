"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  useInsideTooltipContent,
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

function TraitTooltipBody({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <span>
      <span className="font-mono tracking-[0.14em] uppercase">{label}</span>
      {" — "}
      {description}
    </span>
  )
}

/**
 * Nested Base UI tooltips close the parent on purpose. Inside another tooltip,
 * render a local hover panel so both readouts stay visible.
 */
function NestedTraitTooltip({
  label,
  description,
  children,
}: {
  label: string
  description: string
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex cursor-help"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      aria-label={`${label}: ${description}`}
    >
      {children}
      {open ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-[60] mb-1.5 w-max max-w-xs -translate-x-1/2 rounded-md bg-foreground px-3 py-1.5 text-left text-xs leading-relaxed text-background shadow-md"
        >
          <TraitTooltipBody label={label} description={description} />
        </span>
      ) : null}
    </span>
  )
}

export function TraitBadge({
  tag,
  className,
}: {
  tag: RecordTag
  className?: string
}) {
  const insideTooltip = useInsideTooltipContent()

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

  if (insideTooltip) {
    return (
      <NestedTraitTooltip label={tag.label} description={tag.description}>
        {linked}
      </NestedTraitTooltip>
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className="cursor-help" />}
        aria-label={`${tag.label}: ${tag.description}`}
      >
        {linked}
      </TooltipTrigger>
      <TooltipContent className="max-w-xs rounded-none text-left leading-relaxed">
        <TraitTooltipBody label={tag.label} description={tag.description} />
      </TooltipContent>
    </Tooltip>
  )
}
