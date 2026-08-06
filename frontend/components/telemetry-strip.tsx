import { API_BASE_URL, type ModuleTelemetry } from "@/lib/api"
import { dataModules } from "@/lib/modules"
import { cn } from "@/lib/utils"

function formatSyncTime(): string {
  return `${new Date().toISOString().slice(0, 19).replace("T", " ")}Z`
}

/** Link status, dataset reach and record totals across the whole backend. */
export function TelemetryStrip({
  telemetry,
}: {
  telemetry: ModuleTelemetry
}) {
  const counts = dataModules.map((module) => telemetry[module.id])
  const reachable = counts.filter((count) => count !== null).length
  const totalRecords = counts.reduce<number>(
    (sum, count) => sum + (count ?? 0),
    0
  )

  const status =
    reachable === 0 ? "offline" : reachable < counts.length ? "degraded" : "nominal"

  const statusTone = {
    nominal: { text: "text-viridian", dot: "bg-viridian" },
    degraded: { text: "text-ochre", dot: "bg-ochre" },
    offline: { text: "text-oxide", dot: "bg-oxide" },
  }[status]

  const readouts: { label: string; value: string; tone?: string }[] = [
    { label: "Datasets", value: `${reachable}/${counts.length}` },
    { label: "Records", value: String(totalRecords) },
    { label: "Endpoint", value: API_BASE_URL.replace(/^https?:\/\//, "") },
    { label: "Sync", value: formatSyncTime() },
  ]

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border border-hairline bg-panel/50 px-4 py-2.5">
      <span className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn("size-2 animate-pulse rounded-full", statusTone.dot)}
        />
        <span className="console-label text-muted-foreground">Link</span>
        <span className={cn("console-label", statusTone.text)}>{status}</span>
      </span>

      {readouts.map((readout) => (
        <span key={readout.label} className="flex items-center gap-2">
          <span className="console-label text-muted-foreground">
            {readout.label}
          </span>
          <span className="font-mono text-xs text-foreground/90">
            {readout.value}
          </span>
        </span>
      ))}
    </div>
  )
}
