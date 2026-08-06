import type { Metadata } from "next"

import { ConsolePanel } from "@/components/console-panel"
import { DatasetView } from "@/components/dataset-view"
import { getCalledShots, getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import { indexTraits, traitTags, type DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links"

const dataset = getModule("called-shots")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function CalledShotsPage() {
  const [result, traitsResult, links] = await Promise.all([
    getCalledShots(),
    getTraits(),
    buildRuleLinkCatalog(),
  ])
  const traitIndex = indexTraits(traitsResult.data ?? [])

  const records: DataRecord[] = (result.data ?? []).map((shot) => ({
    id: shot.id,
    title: shot.location,
    kicker: "Hit location",
    group: `${shot.cost} ${shot.cost === 1 ? "point" : "points"}`,
    description: shot.description,
    stats: [
      { label: "Cost", value: `${shot.cost} AP`, primary: true },
      {
        label: "To hit",
        value: shot.penalty > 0 ? `+${shot.penalty}` : String(shot.penalty),
        primary: true,
      },
    ],
    pips: { value: shot.cost, max: 3, label: `${shot.cost} of 3 action points` },
    tags: traitTags(shot.traits, traitIndex),
  }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="called-shots"
      facetLabel="Cost"
      links={links}
      footnote={
        <ConsolePanel label="Sequencing" code="NOTE" accent="oxide">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Declare the location before rolling. The penalty applies to the
            attack roll and stacks with any Multiple Attack Penalty already in
            effect; the location effect only lands on a hit.
          </p>
        </ConsolePanel>
      }
    />
  )
}
