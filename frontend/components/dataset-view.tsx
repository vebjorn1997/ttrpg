import type { ReactNode } from "react"

import { DataExplorer } from "@/components/data-explorer"
import { OfflineNotice } from "@/components/offline-notice"
import { PageHeader } from "@/components/page-header"
import type { DataModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"

type DatasetViewProps = {
  module: DataModule
  /** Transport error from the API, or null on success. */
  error: string | null
  records: DataRecord[]
  facetLabel?: string
  defaultView?: "grid" | "table"
  gridClassName?: string
  /** Optional rules note rendered under the explorer. */
  footnote?: ReactNode
}

/**
 * Shared frame for the eight dataset pages: header, then either the explorer
 * or an offline notice. Each page only has to map its API shape onto
 * `DataRecord`.
 */
export function DatasetView({
  module,
  error,
  records,
  facetLabel,
  defaultView,
  gridClassName,
  footnote,
}: DatasetViewProps) {
  return (
    <div className="space-y-5">
      <PageHeader module={module} count={error ? null : records.length} />

      {error ? (
        <OfflineNotice error={error} endpoint={module.endpoint} />
      ) : (
        <>
          <DataExplorer
            records={records}
            unit={module.units}
            accent={module.accent}
            facetLabel={facetLabel}
            searchPlaceholder={`Search ${module.units}…`}
            defaultView={defaultView}
            gridClassName={gridClassName}
          />
          {footnote}
        </>
      )}
    </div>
  )
}
