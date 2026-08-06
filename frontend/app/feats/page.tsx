import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getFeats, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import {
  indexTraits,
  traitTags,
  type DataRecord,
  type RecordStat,
} from "@/lib/records"

const dataset = getModule("feats")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function FeatsPage() {
  const [result, traitsResult] = await Promise.all([getFeats(), getTraits()])
  const traitIndex = indexTraits(traitsResult.data ?? [])

  const records: DataRecord[] = (result.data ?? []).map((feat) => {
    const stats: RecordStat[] = [
      {
        label: "Prerequisite",
        value: feat.prerequisites?.trim() || "None",
        primary: true,
      },
    ]

    if (feat.cost.trim()) {
      stats.push({ label: "Cost", value: feat.cost })
    }

    return {
      id: feat.id,
      title: feat.name,
      kicker: feat.type,
      group: feat.type,
      description: feat.description,
      stats,
      tags: traitTags(feat.traits, traitIndex),
    }
  })

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      facetLabel="Type"
    />
  )
}
