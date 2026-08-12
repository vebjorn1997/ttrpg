import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getTechLevels } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"

const dataset = getModule("tl")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function TechLevelsPage() {
  const [result, links] = await Promise.all([
    getTechLevels(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? [])
    .slice()
    .sort((a, b) => a.level - b.level)
    .map((entry) => ({
      id: entry.id,
      title: entry.name,
      kicker: `TL ${entry.level}`,
      description: entry.description,
      stats: [{ label: "Level", value: String(entry.level), primary: true }],
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
