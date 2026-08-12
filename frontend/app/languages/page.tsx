import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getLanguages } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links"

const dataset = getModule("languages")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function LanguagesPage() {
  const [result, links] = await Promise.all([
    getLanguages(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? []).map((entry) => ({
    id: entry.id,
    title: entry.name,
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
