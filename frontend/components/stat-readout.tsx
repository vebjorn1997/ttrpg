import { cn } from "@/lib/utils"

/**
 * Label and value joined by a dotted leader, the way instrument readouts and
 * Traveller character sheets present paired figures.
 */
export function StatReadout({
  label,
  value,
  emphasis = false,
  className,
}: {
  label: string
  value: string
  emphasis?: boolean
  className?: string
}) {
  return (
    <div className={cn("flex items-baseline gap-1.5", className)}>
      <span className="console-label shrink-0 text-muted-foreground">
        {label}
      </span>
      <span aria-hidden className="leader-dots h-3 min-w-3 flex-1" />
      <span
        className={cn(
          "shrink-0 font-mono text-sm",
          emphasis ? "text-ochre" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}
