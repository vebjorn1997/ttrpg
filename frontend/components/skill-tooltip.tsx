"use client"

import type { ReactNode } from "react"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type SkillTooltipProps = {
  name: string
  description?: string | null
  children: ReactNode
  className?: string
}

/** Hover description for a skill name; always opens below the trigger. */
export function SkillTooltip({
  name,
  description,
  children,
  className,
}: SkillTooltipProps) {
  const text = description?.trim()
  if (!text) {
    return className ? (
      <span className={className}>{children}</span>
    ) : (
      children
    )
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={<span className={cn("block min-w-0", className)} />}
        aria-label={`${name}: ${text}`}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent
        side="bottom"
        sideOffset={8}
        className="max-w-sm rounded-none border border-hairline bg-card px-3 py-2 text-left text-xs leading-relaxed text-foreground shadow-md"
      >
        <span className="block font-heading text-[0.7rem] tracking-[0.12em] uppercase text-ochre">
          {name}
        </span>
        <span className="mt-1 block">{text}</span>
      </TooltipContent>
    </Tooltip>
  )
}
