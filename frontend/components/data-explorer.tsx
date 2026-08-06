"use client"

import { useMemo, useState } from "react"
import { ArrowDownAZ, LayoutGrid, ListOrdered, Rows3, Search, X } from "lucide-react"

import { RecordCard } from "@/components/record-card"
import { RuleText } from "@/components/rule-text"
import { TraitBadge } from "@/components/trait-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { accentClasses, type Accent } from "@/lib/modules"
import { collectGroups, searchHaystack, type DataRecord } from "@/lib/records"
import { cn } from "@/lib/utils"

type ViewMode = "grid" | "table"
type SortMode = "index" | "alpha"

type DataExplorerProps = {
  records: DataRecord[]
  /** Plural noun for the result readout, e.g. "actions". */
  unit: string
  accent?: Accent
  /** Caption above the filter chips, e.g. "TYPE". */
  facetLabel?: string
  searchPlaceholder?: string
  defaultView?: ViewMode
  gridClassName?: string
}

/**
 * Search, filter and view switching for a normalised dataset. Data arrives
 * pre-rendered from the server, so every interaction here is local and
 * instant — no refetching and no loading states.
 */
export function DataExplorer({
  records,
  unit,
  accent = "ochre",
  facetLabel = "FILTER",
  searchPlaceholder = "Search…",
  defaultView = "grid",
  gridClassName,
}: DataExplorerProps) {
  const [query, setQuery] = useState("")
  const [group, setGroup] = useState<string | null>(null)
  const [view, setView] = useState<ViewMode>(defaultView)
  const [sort, setSort] = useState<SortMode>("index")

  const tone = accentClasses[accent]
  const groups = useMemo(() => collectGroups(records), [records])

  const indexed = useMemo(
    () =>
      records.map((record, index) => ({
        record,
        index,
        haystack: searchHaystack(record),
      })),
    [records]
  )

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()

    const filtered = indexed.filter(
      (entry) =>
        (!group || entry.record.group === group) &&
        (!needle || entry.haystack.includes(needle))
    )

    if (sort === "alpha") {
      return [...filtered].sort((a, b) =>
        a.record.title.localeCompare(b.record.title)
      )
    }

    return filtered
  }, [indexed, query, group, sort])

  // Stat labels are consistent within a dataset, so the union across records
  // gives the table its columns.
  const statColumns = useMemo(() => {
    const labels: string[] = []
    for (const record of records) {
      for (const stat of record.stats ?? []) {
        if (!labels.includes(stat.label)) labels.push(stat.label)
      }
    }
    return labels
  }, [records])

  const hasTags = records.some((record) => (record.tags?.length ?? 0) > 0)

  return (
    <div className="space-y-4">
      <div className="border border-hairline bg-card/70">
        <div className="flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:max-w-xs">
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              aria-label={`Search ${unit}`}
              className="h-8 rounded-none border-hairline pl-8 font-mono text-xs tracking-wide"
            />
            {query && (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute top-1/2 right-1 -translate-y-1/2 rounded-none"
              >
                <X />
              </Button>
            )}
          </div>

          {groups.length > 1 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="console-label text-muted-foreground">
                {facetLabel}
              </span>
              <Button
                variant={group === null ? "secondary" : "ghost"}
                size="xs"
                onClick={() => setGroup(null)}
                aria-pressed={group === null}
                className="rounded-none font-mono text-[0.65rem] tracking-[0.14em] uppercase"
              >
                All
              </Button>
              {groups.map((option) => (
                <Button
                  key={option}
                  variant={group === option ? "secondary" : "ghost"}
                  size="xs"
                  onClick={() => setGroup(group === option ? null : option)}
                  aria-pressed={group === option}
                  className="rounded-none font-mono text-[0.65rem] tracking-[0.14em] uppercase"
                >
                  {option}
                </Button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 lg:ml-auto">
            <div className="flex items-center gap-1">
              <span className="console-label text-muted-foreground">Sort</span>
              <Button
                variant={sort === "index" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setSort("index")}
                aria-pressed={sort === "index"}
                aria-label="Sort by source order"
                className="rounded-none"
              >
                <ListOrdered />
              </Button>
              <Button
                variant={sort === "alpha" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setSort("alpha")}
                aria-pressed={sort === "alpha"}
                aria-label="Sort alphabetically"
                className="rounded-none"
              >
                <ArrowDownAZ />
              </Button>
            </div>

            <div className="flex items-center gap-1">
              <span className="console-label text-muted-foreground">View</span>
              <Button
                variant={view === "grid" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setView("grid")}
                aria-pressed={view === "grid"}
                aria-label="Card view"
                className="rounded-none"
              >
                <LayoutGrid />
              </Button>
              <Button
                variant={view === "table" ? "secondary" : "ghost"}
                size="icon-xs"
                onClick={() => setView("table")}
                aria-pressed={view === "table"}
                aria-label="Table view"
                className="rounded-none"
              >
                <Rows3 />
              </Button>
            </div>
          </div>
        </div>

        <div
          className="flex items-center gap-2 border-t border-hairline px-3 py-1.5"
          aria-live="polite"
        >
          <span className={cn("console-label", tone.text)}>
            {String(visible.length).padStart(2, "0")} / {String(records.length).padStart(2, "0")}
          </span>
          <span className="console-label text-muted-foreground">
            {unit} shown
          </span>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="border border-dashed border-hairline bg-card/40 px-4 py-12 text-center">
          <p className="console-label text-muted-foreground">No matches</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nothing in this dataset matches{" "}
            <span className="font-mono text-foreground">{query || facetLabel}</span>.
          </p>
        </div>
      ) : view === "grid" ? (
        <div
          className={cn(
            "grid gap-3 sm:grid-cols-2 xl:grid-cols-3",
            gridClassName
          )}
        >
          {visible.map((entry) => (
            <RecordCard
              key={entry.record.id}
              record={entry.record}
              index={entry.index}
              accent={accent}
            />
          ))}
        </div>
      ) : (
        <div className="border border-hairline bg-card/70">
          <Table className="font-sans">
            <TableHeader>
              <TableRow className="border-hairline hover:bg-transparent">
                <TableHead className="console-label w-10 text-muted-foreground">
                  #
                </TableHead>
                <TableHead className="console-label text-muted-foreground">
                  Name
                </TableHead>
                {statColumns.map((label) => (
                  <TableHead
                    key={label}
                    className="console-label text-muted-foreground"
                  >
                    {label}
                  </TableHead>
                ))}
                <TableHead className="console-label min-w-[22rem] text-muted-foreground">
                  Description
                </TableHead>
                {hasTags && (
                  <TableHead className="console-label text-muted-foreground">
                    Traits
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((entry) => (
                <TableRow key={entry.record.id} className="border-hairline">
                  <TableCell className="font-mono text-xs text-muted-foreground/70">
                    {String(entry.index + 1).padStart(2, "0")}
                  </TableCell>
                  <TableCell className="align-top">
                    <span className="font-heading font-medium tracking-wide">
                      {entry.record.title}
                    </span>
                    {entry.record.kicker && (
                      <span className={cn("console-label ml-2", tone.text)}>
                        {entry.record.kicker}
                      </span>
                    )}
                  </TableCell>
                  {statColumns.map((label) => {
                    const stat = entry.record.stats?.find(
                      (candidate) => candidate.label === label
                    )
                    return (
                      <TableCell
                        key={label}
                        className={cn(
                          "align-top font-mono text-xs",
                          stat?.primary ? tone.text : "text-foreground/80"
                        )}
                      >
                        {stat?.value ?? "—"}
                      </TableCell>
                    )
                  })}
                  <TableCell className="max-w-xl align-top whitespace-normal text-foreground/85">
                    <RuleText text={entry.record.description} />
                    {entry.record.bullets && entry.record.bullets.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {entry.record.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="text-sm">
                            <span
                              aria-hidden
                              className={cn("mr-1.5 font-mono", tone.text)}
                            >
                              &rsaquo;
                            </span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </TableCell>
                  {hasTags && (
                    <TableCell className="align-top">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.record.tags?.map((tag) => (
                          <TraitBadge key={tag.label} tag={tag} />
                        ))}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
