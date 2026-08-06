import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getHealing, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { indexTraits, traitTags, type DataRecord } from "@/lib/records"

const dataset = getModule("healing")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function HealingPage() {
  const [result, traitsResult] = await Promise.all([getHealing(), getTraits()])
  const traitIndex = indexTraits(traitsResult.data ?? [])

  const records: DataRecord[] = (result.data ?? []).map((procedure) => ({
    id: procedure.id,
    title: procedure.name,
    kicker: "Procedure",
    description: procedure.description,
    stats: [{ label: "Requires", value: procedure.cost, primary: true }],
    tags: traitTags(procedure.traits, traitIndex),
  }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      gridClassName="sm:grid-cols-2 xl:grid-cols-3"
    />
  )
}
