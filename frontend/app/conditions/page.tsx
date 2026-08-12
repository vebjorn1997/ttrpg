import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getConditions, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { indexTraits, traitTags, type DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"

const dataset = getModule("conditions")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function ConditionsPage() {
  const [result, traitsResult, links] = await Promise.all([
    getConditions(),
    getTraits(),
    buildRuleLinkCatalog(),
  ])
  const traitIndex = indexTraits(traitsResult.data ?? [])

  const records: DataRecord[] = (result.data ?? []).map((condition) => ({
    id: condition.id,
    title: condition.name,
    description: condition.description,
    tags: traitTags(condition.traits, traitIndex),
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
