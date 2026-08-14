import { cn } from "@/lib/utils"

/**
 * Reputation runs -5 to +5, which the 0–5 RatingMeter cannot express. A signed
 * number carries the sign that matters: below zero the patron has form.
 */
export function PatronReputation({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const tone =
    value < 0
      ? "text-oxide"
      : value > 0
        ? "text-viridian"
        : "text-muted-foreground"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border border-hairline bg-background/30 px-2 py-0.5",
        className
      )}
    >
      <span className="console-label text-muted-foreground">Rep</span>
      <span className={cn("font-mono text-xs", tone)}>
        {value > 0 ? `+${value}` : value}
      </span>
    </span>
  )
}
