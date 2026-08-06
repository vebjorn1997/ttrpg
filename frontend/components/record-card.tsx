import { CostPips } from "@/components/cost-pips"
import { RuleText } from "@/components/rule-text"
import { StatReadout } from "@/components/stat-readout"
import { TraitBadge } from "@/components/trait-badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { accentClasses, type Accent } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { cn } from "@/lib/utils"

/** One dataset row rendered as an instrument card. */
export function RecordCard({
  record,
  index,
  accent = "ochre",
}: {
  record: DataRecord
  index: number
  accent?: Accent
}) {
  const tone = accentClasses[accent]

  return (
    <Card
      className={cn(
        "group gap-0 rounded-none border border-hairline bg-card/70 py-0 ring-0 transition-colors",
        "hover:bg-card",
        tone.hoverBorder
      )}
    >
      <CardHeader className="flex items-start gap-3 rounded-none border-b border-hairline px-4 py-2.5">
        <span className="console-label mt-1 shrink-0 text-muted-foreground/70">
          {String(index + 1).padStart(2, "0")}
        </span>

        <div className="min-w-0 flex-1">
          {record.kicker && (
            <p className={cn("console-label", tone.text)}>{record.kicker}</p>
          )}
          <h3
            data-slot="card-title"
            className="font-heading text-base leading-tight font-medium tracking-wide"
          >
            {record.title}
          </h3>
        </div>

        {record.pips && (
          <CostPips
            value={record.pips.value}
            max={record.pips.max}
            label={record.pips.label}
            className="mt-1 shrink-0"
          />
        )}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-4 py-3">
        {record.stats && record.stats.length > 0 && (
          <dl className="grid gap-1">
            {record.stats.map((stat) => (
              <StatReadout
                key={stat.label}
                label={stat.label}
                value={stat.value}
                emphasis={stat.primary}
              />
            ))}
          </dl>
        )}

        {record.description && (
          <RuleText text={record.description} className="text-foreground/85" />
        )}

        {record.bullets && record.bullets.length > 0 && (
          <ul className="space-y-1.5 border-l border-hairline pl-3">
            {record.bullets.map((bullet, bulletIndex) => (
              <li
                key={bulletIndex}
                className="text-sm leading-relaxed text-foreground/85"
              >
                <span aria-hidden className={cn("mr-1.5 font-mono", tone.text)}>
                  &rsaquo;
                </span>
                {bullet}
              </li>
            ))}
          </ul>
        )}

        {record.tags && record.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            {record.tags.map((tag) => (
              <TraitBadge key={tag.label} tag={tag} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
