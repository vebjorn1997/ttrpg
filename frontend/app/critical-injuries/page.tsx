import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getCriticalInjuries, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { indexTraits, traitTags, type DataRecord } from "@/lib/records"

const dataset = getModule("critical-injuries")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function CriticalInjuriesPage() {
  const [result, traitsResult] = await Promise.all([
    getCriticalInjuries(),
    getTraits(),
  ])
  const traitIndex = indexTraits(traitsResult.data ?? [])

  const records: DataRecord[] = (result.data ?? []).map((injury) => ({
    id: injury.id,
    title: injury.name,
    kicker: injury.characteristic,
    group: injury.characteristic,
    description: injury.description,
    tags: traitTags(injury.traits, traitIndex),
  }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      facetLabel="Characteristic"
    />
  )
}
