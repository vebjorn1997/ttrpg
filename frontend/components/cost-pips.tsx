import { cn } from "@/lib/utils"

/**
 * Action point cost as filled/empty pips against the three-point turn budget,
 * so relative cost reads at a glance rather than needing a number compared.
 */
export function CostPips({
  value,
  max = 3,
  label,
  className,
}: {
  value: number
  max?: number
  label: string
  className?: string
}) {
  const filled = Math.max(0, Math.min(value, max))

  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          aria-hidden
          className={cn(
            "size-2 border",
            index < filled
              ? "border-ochre bg-ochre"
              : "border-ochre/35 bg-transparent"
          )}
        />
      ))}
    </span>
  )
}
