import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getMiscellaneous } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"

const dataset = getModule("miscellaneous")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function MiscellaneousPage() {
  const [result, links] = await Promise.all([
    getMiscellaneous(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? [])
    .slice()
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => ({
      id: entry.id,
      title: entry.name,
      kicker: "Procedure",
      description: entry.description,
    }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="glossary"
      links={links}
    />
  )
}
