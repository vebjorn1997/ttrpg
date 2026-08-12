import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getLawLevels } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links"

const dataset = getModule("lawlevel")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function LawLevelsPage() {
  const [result, links] = await Promise.all([
    getLawLevels(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? [])
    .slice()
    .sort((a, b) => a.lawlevel - b.lawlevel)
    .map((entry) => ({
      id: entry.id,
      title: entry.name,
      kicker: `LL ${entry.lawlevel}`,
      description: entry.description,
      stats: [
        { label: "Level", value: String(entry.lawlevel), primary: true },
      ],
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
