import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { accentClasses, type DataModule } from "@/lib/modules"
import { cn } from "@/lib/utils"

/**
 * Dashboard tile for one dataset. Doubles as a status light: a null count
 * means that endpoint did not answer.
 */
export function ModuleCard({
  module,
  count,
}: {
  module: DataModule
  count: number | null
}) {
  const Icon = module.icon
  const tone = accentClasses[module.accent]
  const offline = count === null

  return (
    <Link
      href={module.href}
      className={cn(
        "group relative flex flex-col border border-hairline bg-card/70 transition-all",
        "hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        offline ? "hover:border-oxide/70" : cn(tone.hoverBorder, tone.glow)
      )}
    >
      <div className="flex items-center gap-2 border-b border-hairline px-4 py-2">
        <span className={cn("console-label", tone.text)}>{module.code}</span>
        <span aria-hidden className="console-hatch h-2.5 flex-1 opacity-60" />
        <span
          className={cn(
            "console-label",
            offline ? "text-oxide" : "text-muted-foreground"
          )}
        >
          {offline ? "offline" : "online"}
        </span>
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            offline ? "bg-oxide" : "bg-viridian"
          )}
        />
      </div>

      <div className="flex flex-1 items-start gap-4 p-4">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center border transition-colors",
            tone.border,
            tone.bg
          )}
        >
          <Icon className={cn("size-5", tone.text)} />
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-base leading-tight font-medium tracking-wide uppercase">
            {module.title}
          </h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {module.synopsis}
          </p>
        </div>

        <ArrowUpRight
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground/50 transition-all",
            "group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground"
          )}
        />
      </div>

      <div className="flex items-baseline gap-2 border-t border-hairline px-4 py-2">
        <span className={cn("font-mono text-xl leading-none", tone.text)}>
          {offline ? "––" : String(count).padStart(2, "0")}
        </span>
        <span className="console-label text-muted-foreground">
          {module.units}
        </span>
        <span className="console-label ml-auto font-mono text-muted-foreground/60 lowercase">
          {module.endpoint}
        </span>
      </div>
    </Link>
  )
}
