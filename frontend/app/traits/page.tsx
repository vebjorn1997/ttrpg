import type { Metadata } from "next"

import { ConsolePanel } from "@/components/console-panel"
import { DatasetView } from "@/components/dataset-view"
import { getTraits } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"

const dataset = getModule("traits")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function TraitsPage() {
  const result = await getTraits()

  const records: DataRecord[] = (result.data ?? []).map((trait) => ({
    id: trait.id,
    title: trait.name,
    kicker: "Trait",
    description: trait.description,
  }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      footnote={
        <ConsolePanel label="Where traits appear" code="NOTE" accent="viridian">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Traits are shared tags rather than a subsystem of their own. Weapon
            traits gate the actions a weapon allows, rank traits set how many
            features an NPC carries, and damage traits like Fire apply their own
            ongoing effect.
          </p>
        </ConsolePanel>
      }
    />
  )
}
