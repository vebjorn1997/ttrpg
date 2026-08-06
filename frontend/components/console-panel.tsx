import type { ReactNode } from "react"

import { CornerBrackets } from "@/components/corner-brackets"
import { accentClasses, type Accent } from "@/lib/modules"
import { cn } from "@/lib/utils"

type ConsolePanelProps = {
  /** Left-hand caption in the header strip. */
  label?: string
  /** Right-hand designation in the header strip, e.g. "ACT-030". */
  code?: string
  /** Extra header content, rendered after the code. */
  aside?: ReactNode
  accent?: Accent
  brackets?: boolean
  className?: string
  bodyClassName?: string
  children: ReactNode
}

/**
 * The project's base surface: a hard-edged instrument panel with a hatched
 * header strip. Used everywhere a shadcn Card would be too soft.
 */
export function ConsolePanel({
  label,
  code,
  aside,
  accent = "ochre",
  brackets = false,
  className,
  bodyClassName,
  children,
}: ConsolePanelProps) {
  const tone = accentClasses[accent]

  return (
    <section
      className={cn(
        "relative border border-hairline bg-card/80 backdrop-blur-[2px]",
        className
      )}
    >
      {(label || code || aside) && (
        <header className="flex items-center gap-3 border-b border-hairline bg-panel/70 px-3 py-1.5">
          {label && (
            <span className={cn("console-label", tone.text)}>{label}</span>
          )}
          <span aria-hidden className="console-hatch h-2.5 flex-1 opacity-70" />
          {code && (
            <span className="console-label text-muted-foreground">{code}</span>
          )}
          {aside}
        </header>
      )}

      <div className={cn("p-4", bodyClassName)}>{children}</div>

      {brackets && <CornerBrackets />}
    </section>
  )
}
