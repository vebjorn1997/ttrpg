"use client"

import { useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  ArrowDownAZ,
  ChevronRight,
  ListOrdered,
  Search,
  X,
} from "lucide-react"

import { RuleDetail } from "@/components/rule-detail"
import { RuleIndexRow } from "@/components/rule-index-row"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { accentClasses, type Accent } from "@/lib/modules"
import {
  collectGroups,
  searchHaystack,
  type DataRecord,
  type RuleLayout,
} from "@/lib/records"
import type { RuleLinkEntry } from "@/lib/rule-links"
import { cn } from "@/lib/utils"

type SortMode = "index" | "alpha"

type RuleBrowserProps = {
  records: DataRecord[]
  layout: RuleLayout
  /** Plural noun for the result readout, e.g. "actions". */
  unit: string
  accent?: Accent
  /** Caption above the filter chips, e.g. "TYPE". */
  facetLabel?: string
  searchPlaceholder?: string
  /** When true, index lists are sectioned by `group` (source order). */
  sectionByGroup?: boolean
  links?: RuleLinkEntry[]
}

type IndexedEntry = {
  record: DataRecord
  index: number
  haystack: string
}

/**
 * Field-manual browser: searchable index on the left, focused rule detail on
 * the right (desktop). Mobile opens the detail in a sheet. Selection syncs to
 * `?id=` for deep links without a backend GET-by-id.
 */
export function RuleBrowser({
  records,
  layout,
  unit,
  accent = "ochre",
  facetLabel = "FILTER",
  searchPlaceholder = "Search…",
  sectionByGroup = false,
  links = [],
}: RuleBrowserProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedId = searchParams.get("id")

  const [query, setQuery] = useState("")
  const [group, setGroup] = useState<string | null>(null)
  const [sort, setSort] = useState<SortMode>("index")
  const [mobileOpen, setMobileOpen] = useState(false)
  /** Section labels currently collapsed in the index pane. */
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(
    () => new Set()
  )

  const tone = accentClasses[accent]
  const groups = useMemo(() => collectGroups(records), [records])

  const indexed = useMemo<IndexedEntry[]>(
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

  const selected =
    records.find((record) => record.id === selectedId) ??
    (visible[0]?.record ?? records[0] ?? null)

  useEffect(() => {
    if (!selectedId && records[0]) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("id", records[0].id)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
    // Only seed the URL once when no id is present.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- searchParams identity churns
  }, [selectedId, records, pathname, router])

  useEffect(() => {
    // Deep link opened with an id: show the mobile sheet on first paint.
    if (selectedId && records.some((record) => record.id === selectedId)) {
      const isCoarse =
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 1023px)").matches
      if (isCoarse) setMobileOpen(true)
    }
    // Intentionally run once for the inbound deep link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function selectRecord(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("id", id)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 1023px)").matches
    ) {
      setMobileOpen(true)
    }
  }

  function toggleSection(label: string) {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const sections = useMemo(() => {
    if (!sectionByGroup || sort === "alpha" || group) {
      return [{ label: null as string | null, entries: visible }]
    }

    const order = collectGroups(visible.map((entry) => entry.record))
    const byGroup = new Map<string, IndexedEntry[]>()
    const ungrouped: IndexedEntry[] = []

    for (const entry of visible) {
      const key = entry.record.group
      if (!key) {
        ungrouped.push(entry)
        continue
      }
      const bucket = byGroup.get(key) ?? []
      bucket.push(entry)
      byGroup.set(key, bucket)
    }

    const result: { label: string | null; entries: IndexedEntry[] }[] =
      order.map((label) => ({
        label,
        entries: byGroup.get(label) ?? [],
      }))

    if (ungrouped.length > 0) {
      result.push({ label: null, entries: ungrouped })
    }

    return result.filter((section) => section.entries.length > 0)
  }, [visible, sectionByGroup, sort, group])

  // When selection moves into a collapsed section, open it (deep links / clicks).
  useEffect(() => {
    const label = selected?.group
    if (!label || !sectionByGroup) return
    setCollapsed((prev) => {
      if (!prev.has(label)) return prev
      const next = new Set(prev)
      next.delete(label)
      return next
    })
  }, [selected?.id, selected?.group, sectionByGroup])

  return (
    <div className="space-y-4">
      <div className="border border-hairline bg-card/60">
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

          <div className="flex items-center gap-1 lg:ml-auto">
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
        </div>

        <div
          className="flex items-center gap-2 border-t border-hairline px-3 py-1.5"
          aria-live="polite"
        >
          <span className={cn("console-label", tone.text)}>
            {String(visible.length).padStart(2, "0")} /{" "}
            {String(records.length).padStart(2, "0")}
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
            <span className="font-mono text-foreground">
              {query || facetLabel}
            </span>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto border border-hairline bg-card/40 lg:max-h-[min(78vh,44rem)]">
            {sections.map((section) => {
              const isCollapsible = Boolean(section.label)
              const isOpen =
                !isCollapsible || !collapsed.has(section.label as string)

              return (
                <div key={section.label ?? "all"}>
                  {section.label && (
                    <button
                      type="button"
                      onClick={() => toggleSection(section.label as string)}
                      aria-expanded={isOpen}
                      className={cn(
                        "sticky top-0 z-10 flex w-full items-center gap-1.5 border-b border-hairline bg-panel/95 px-3 py-1.5 text-left backdrop-blur-sm",
                        "transition-colors hover:bg-card/80 focus-visible:bg-card/80 focus-visible:outline-none"
                      )}
                    >
                      <ChevronRight
                        aria-hidden
                        className={cn(
                          "size-3 shrink-0 text-muted-foreground transition-transform",
                          isOpen && "rotate-90"
                        )}
                      />
                      <span className={cn("console-label", tone.text)}>
                        {section.label}
                      </span>
                      <span className="console-label ml-auto text-muted-foreground/60">
                        {String(section.entries.length).padStart(2, "0")}
                      </span>
                    </button>
                  )}
                  {isOpen &&
                    section.entries.map((entry) => (
                      <RuleIndexRow
                        key={entry.record.id}
                        record={entry.record}
                        index={entry.index}
                        layout={layout}
                        accent={accent}
                        selected={selected?.id === entry.record.id}
                        onSelect={() => selectRecord(entry.record.id)}
                      />
                    ))}
                </div>
              )
            })}
          </div>

          <div className="hidden min-h-96 border border-hairline bg-card/50 lg:block lg:max-h-[min(78vh,44rem)] lg:overflow-hidden">
            {selected ? (
              <div className="h-full overflow-y-auto">
                <RuleDetail
                  record={selected}
                  layout={layout}
                  accent={accent}
                  links={links}
                />
              </div>
            ) : (
              <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
                Select a rule to read it here.
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet
        open={mobileOpen && Boolean(selected)}
        onOpenChange={setMobileOpen}
      >
        <SheetContent
          side="bottom"
          className="max-h-[85vh] rounded-none border-hairline bg-card p-0 sm:max-w-none lg:hidden"
          showCloseButton
        >
          {selected && (
            <>
              <SheetHeader className="sr-only">
                <SheetTitle>{selected.title}</SheetTitle>
              </SheetHeader>
              <div className="overflow-y-auto">
                <RuleDetail
                  record={selected}
                  layout={layout}
                  accent={accent}
                  links={links}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
