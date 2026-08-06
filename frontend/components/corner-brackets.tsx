import { cn } from "@/lib/utils"

/**
 * Four L-shaped brackets pinned to a container's corners — the framing device
 * used on Traveller deck plans and gunnery displays.
 */
export function CornerBrackets({ className }: { className?: string }) {
  const shared = "pointer-events-none absolute size-2.5"

  return (
    <span aria-hidden className={cn("text-ochre/70", className)}>
      <span className={cn(shared, "top-0 left-0 border-t border-l")} />
      <span className={cn(shared, "top-0 right-0 border-t border-r")} />
      <span className={cn(shared, "bottom-0 left-0 border-b border-l")} />
      <span className={cn(shared, "bottom-0 right-0 border-r border-b")} />
    </span>
  )
}
