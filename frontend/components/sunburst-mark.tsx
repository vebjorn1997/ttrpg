import { cn } from "@/lib/utils"

/**
 * Radiating mark used as the site logotype — a nod to the sunburst insignia
 * stamped on Imperial hardware.
 */
export function SunburstMark({ className }: { className?: string }) {
  const rays = Array.from({ length: 12 }, (_, index) => index * 30)

  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden
      className={cn("size-8 text-ochre", className)}
    >
      <circle
        cx="24"
        cy="24"
        r="21"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.35"
      />
      <circle cx="24" cy="24" r="5.5" fill="currentColor" />
      {rays.map((angle) => (
        <line
          key={angle}
          x1="24"
          y1="24"
          x2="24"
          y2="3.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.75"
          transform={`rotate(${angle} 24 24)`}
        />
      ))}
    </svg>
  )
}
