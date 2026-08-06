import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getActions } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links"

const dataset = getModule("actions")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function ActionsPage() {
  const [result, links] = await Promise.all([
    getActions(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? []).map((action) => {
    const isReaction = action.type.toLowerCase() === "reaction"

    return {
      id: action.id,
      title: action.name,
      kicker: isReaction ? "Reaction" : "Action",
      group: isReaction
        ? "Reaction"
        : `${action.cost} ${action.cost === 1 ? "point" : "points"}`,
      description: action.description,
      stats: [
        {
          label: "Cost",
          value: isReaction ? "1 reaction" : `${action.cost} AP`,
          primary: true,
        },
        ...(action.requiredFeat
          ? [
              {
                label: "Requires",
                value: action.requiredFeat.name,
              },
            ]
          : []),
      ],
      pips: isReaction
        ? null
        : {
            value: action.cost,
            max: 3,
            label: `${action.cost} of 3 action points`,
          },
    }
  })

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="actions"
      facetLabel="Cost"
      sectionByGroup
      links={links}
    />
  )
}
