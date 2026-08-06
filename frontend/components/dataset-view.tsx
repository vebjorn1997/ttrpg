import { Suspense, type ReactNode } from "react"

import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import { RuleBrowser } from "@/components/rule-browser"
import type { DataModule } from "@/lib/modules"
import type { DataRecord, RuleLayout } from "@/lib/records"
import type { RuleLinkEntry } from "@/lib/rule-links"

type DatasetViewProps = {
  module: DataModule
  /** Transport error from the API, or null on success. */
  error: string | null
  records: DataRecord[]
  layout: RuleLayout
  facetLabel?: string
  /** Section the index by `group` (AP bands, characteristics, feat type). */
  sectionByGroup?: boolean
  /** Cross-module title links for rule prose. */
  links?: RuleLinkEntry[]
  /** Optional rules note rendered under the browser. */
  footnote?: ReactNode
}

function BrowserFallback({ unit }: { unit: string }) {
  return (
    <div className="border border-hairline bg-card/40 px-4 py-10 text-center">
      <p className="console-label text-muted-foreground">Loading {unit}…</p>
    </div>
  )
}

/**
 * Shared frame for the eight dataset pages: header, then either the field
 * manual browser or an offline notice. Each page only has to map its API
 * shape onto `DataRecord`.
 */
export function DatasetView({
  module,
  error,
  records,
  layout,
  facetLabel,
  sectionByGroup = false,
  links = [],
  footnote,
}: DatasetViewProps) {
  return (
    <div className="space-y-5">
      <PageHeader module={module} count={error ? null : records.length} />

      {error ? (
        <OfflineNotice error={error} endpoint={module.endpoint} />
      ) : (
        <>
          <Suspense fallback={<BrowserFallback unit={module.units} />}>
            <RuleBrowser
              records={records}
              layout={layout}
              unit={module.units}
              accent={module.accent}
              facetLabel={facetLabel}
              searchPlaceholder={`Search ${module.units}…`}
              sectionByGroup={sectionByGroup}
              links={links}
            />
          </Suspense>
          {footnote}
        </>
      )}
    </div>
  )
}
