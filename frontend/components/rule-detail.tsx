"use client"

import { CostPips } from "@/components/cost-pips"
import { RuleText } from "@/components/rule-text"
import { StatReadout } from "@/components/stat-readout"
import { TraitBadge } from "@/components/trait-badge"
import { accentClasses, type Accent } from "@/lib/modules"
import type { DataRecord, RuleLayout } from "@/lib/records"
import type { RuleLinkEntry } from "@/lib/rule-links"
import { cn } from "@/lib/utils"

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

/** Focused reading pane for a single selected rule. */
export function RuleDetail({
  record,
  layout,
  accent = "ochre",
  links = [],
}: {
  record: DataRecord
  layout: RuleLayout
  accent?: Accent
  links?: RuleLinkEntry[]
}) {
  const tone = accentClasses[accent]
  const isNpc = layout === "npcs"
  const isGlossary = layout === "glossary" || layout === "traits"

  return (
    <article
      className={cn(
        "flex h-full flex-col",
        record.highlight && tone.bg
      )}
    >
      <header className="border-b border-hairline px-4 py-4 sm:px-5">
        <div className="flex items-start gap-3">
          {layout === "traits" && record.swatch && HEX.test(record.swatch) && (
            <span
              aria-hidden
              className="mt-1.5 size-3 shrink-0 border border-white/25"
              style={{
                backgroundColor: `color-mix(in oklab, ${record.swatch}, oklch(0.85 0.03 85) 35%)`,
              }}
            />
          )}

          <div className="min-w-0 flex-1">
            {record.kicker && (
              <p className={cn("console-label", tone.text)}>{record.kicker}</p>
            )}
            <h2 className="font-heading text-xl font-semibold tracking-wide sm:text-2xl">
              {record.title}
            </h2>
          </div>

          {record.pips && (
            <div className="flex shrink-0 flex-col items-end gap-1">
              <span className="console-label text-muted-foreground">AP</span>
              <CostPips
                value={record.pips.value}
                max={record.pips.max}
                label={record.pips.label}
              />
            </div>
          )}
        </div>

        {record.stats && record.stats.length > 0 && !isGlossary && (
          <dl
            className={cn(
              "mt-4 gap-2",
              isNpc ? "grid sm:grid-cols-3" : "grid gap-1"
            )}
          >
            {isNpc
              ? record.stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="border border-hairline bg-background/40 px-3 py-2"
                  >
                    <dt className="console-label text-muted-foreground">
                      {stat.label}
                    </dt>
                    <dd
                      className={cn(
                        "mt-1 font-mono text-lg leading-none",
                        tone.text
                      )}
                    >
                      {stat.value}
                    </dd>
                  </div>
                ))
              : record.stats.map((stat) => (
                  <StatReadout
                    key={stat.label}
                    label={stat.label}
                    value={stat.value}
                    emphasis={stat.primary}
                  />
                ))}
          </dl>
        )}
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
        {record.description && (
          <RuleText
            text={record.description}
            links={links}
            skipTitle={record.title}
          />
        )}

        {record.bullets && record.bullets.length > 0 && (
          <div>
            <p className="console-label mb-2 text-muted-foreground">Features</p>
            <ul className="space-y-3 border-l border-hairline pl-3">
              {record.bullets.map((bullet, bulletIndex) => (
                <li key={bulletIndex} className="flex gap-2">
                  <span
                    aria-hidden
                    className={cn("mt-1 shrink-0 font-mono", tone.text)}
                  >
                    &rsaquo;
                  </span>
                  <RuleText text={bullet} links={links} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {record.tags && record.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {record.tags.map((tag) => (
              <TraitBadge key={tag.id ?? tag.label} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
