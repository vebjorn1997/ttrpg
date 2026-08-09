"use client"

import { CostPips } from "@/components/cost-pips"
import { accentClasses, type Accent } from "@/lib/modules"
import {
  previewText,
  type DataRecord,
  type RuleLayout,
} from "@/lib/records"
import { cn } from "@/lib/utils"

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

function Swatch({ color }: { color: string }) {
  if (!HEX.test(color)) return null
  return (
    <span
      aria-hidden
      className="mt-1 size-2.5 shrink-0 border border-white/20"
      style={{
        backgroundColor: `color-mix(in oklab, ${color}, oklch(0.85 0.03 85) 35%)`,
      }}
    />
  )
}

/** Compact selectable row for the field-manual index pane. */
export function RuleIndexRow({
  record,
  index,
  layout,
  accent = "ochre",
  selected,
  onSelect,
}: {
  record: DataRecord
  index: number
  layout: RuleLayout
  accent?: Accent
  selected: boolean
  onSelect: () => void
}) {
  const tone = accentClasses[accent]
  const preview = previewText(record.description)
  const primaryStat = record.stats?.find((stat) => stat.primary) ?? record.stats?.[0]
  const highlighted = Boolean(record.highlight)

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-b border-hairline px-3 py-2.5 text-left transition-colors",
        "focus-visible:outline-none",
        highlighted
          ? cn(tone.bg, tone.hoverBg)
          : "hover:bg-card/80 focus-visible:bg-card/80",
        selected
          ? cn(highlighted ? undefined : "bg-card", tone.border, "border-l-2")
          : "border-l-2 border-l-transparent"
      )}
    >
      <span className="console-label mt-0.5 w-5 shrink-0 text-muted-foreground/60">
        {String(index + 1).padStart(2, "0")}
      </span>

      {layout === "traits" && record.swatch && <Swatch color={record.swatch} />}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="font-heading text-sm font-medium tracking-wide">
            {record.title}
          </span>
          {record.kicker && layout !== "actions" && (
            <span className={cn("console-label", tone.text)}>{record.kicker}</span>
          )}
        </div>

        {layout === "called-shots" && record.stats && (
          <p className="mt-0.5 font-mono text-[0.7rem] tracking-wide text-muted-foreground">
            {record.stats.map((stat) => `${stat.label} ${stat.value}`).join(" · ")}
          </p>
        )}

        {layout === "npcs" && record.stats && (
          <p className="mt-0.5 font-mono text-[0.7rem] tracking-wide text-muted-foreground">
            {record.stats
              .map((stat) => `${stat.label} ${stat.value}`)
              .join(" · ")}
          </p>
        )}

        {layout === "healing" && primaryStat && (
          <p className="mt-0.5 font-mono text-[0.7rem] tracking-wide text-muted-foreground">
            {primaryStat.value}
          </p>
        )}

        {layout === "feats" && primaryStat && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {primaryStat.value}
          </p>
        )}

        {(layout === "glossary" ||
          layout === "traits" ||
          layout === "actions" ||
          layout === "critical-injuries") &&
          preview && (
            <p className="mt-0.5 line-clamp-1 text-xs leading-relaxed text-muted-foreground">
              {preview}
            </p>
          )}
      </div>

      <div className="mt-0.5 flex shrink-0 flex-col items-end gap-1">
        {record.pips && (
          <CostPips
            value={record.pips.value}
            max={record.pips.max}
            label={record.pips.label}
          />
        )}
        {layout === "actions" && !record.pips && record.stats?.[0] && (
          <span className={cn("console-label", tone.text)}>
            {record.stats[0].value}
          </span>
        )}
        {layout === "called-shots" &&
          record.stats?.find((stat) => stat.label === "To hit") && (
            <span className={cn("font-mono text-xs", tone.text)}>
              {
                record.stats.find((stat) => stat.label === "To hit")
                  ?.value
              }
            </span>
          )}
      </div>
    </button>
  )
}
