import type { Metadata } from "next"

import { ConsolePanel } from "@/components/console-panel"
import { DatasetView } from "@/components/dataset-view"
import { getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links"

const dataset = getModule("traits")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function TraitsPage() {
  const [result, links] = await Promise.all([
    getTraits(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? []).map((trait) => ({
    id: trait.id,
    title: trait.name,
    kicker: trait.type,
    group: trait.type,
    description: trait.description,
    swatch: trait.color,
  }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="traits"
      facetLabel="Type"
      sectionByGroup
      links={links}
      footnote={
        <ConsolePanel label="Where traits appear" code="NOTE" accent="viridian">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Traits are shared tags rather than a subsystem of their own. Each
            entry is typed as Weapon, NPC, or Planet so it can be filtered and
            applied in the right place.
          </p>
        </ConsolePanel>
      }
    />
  )
}
