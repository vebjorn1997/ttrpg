import type { Metadata } from "next"

import { ConsolePanel } from "@/components/console-panel"
import { DatasetView } from "@/components/dataset-view"
import { getNpcs } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"

const dataset = getModule("npcs")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function NpcsPage() {
  const [result, links] = await Promise.all([getNpcs(), buildRuleLinkCatalog()])

  const records: DataRecord[] = (result.data ?? []).map((npc) => ({
    id: npc.id,
    title: npc.name,
    // The rank trait (Normal / Elite / Legendary) doubles as the filter facet.
    kicker: npc.traits[0]?.name ?? null,
    group: npc.traits[0]?.name ?? null,
    description: npc.description,
    stats: [
      { label: "Movement", value: `${npc.movement} m`, primary: true },
      { label: "Hits", value: npc.hp, primary: true },
      { label: "Armour", value: npc.armor, primary: true },
    ],
    bullets: npc.features,
    tags: npc.traits.map((trait) => ({
      label: trait.name,
      description: trait.description,
      color: trait.color,
      id: trait.id,
    })),
  }))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="npcs"
      facetLabel="Rank"
      links={links}
      footnote={
        <ConsolePanel label="Reading a stat block" code="NOTE" accent="signal">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Features are written as{" "}
            <span className="font-mono text-foreground">
              Type (cost) name, effect
            </span>
            . The number in brackets is the action point cost, so a
            Melee&nbsp;(1) attack leaves two points for anything else that turn!
          </p>
        </ConsolePanel>
      }
    />
  )
}
