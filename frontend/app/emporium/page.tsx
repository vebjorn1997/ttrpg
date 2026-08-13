import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getEquipment, getTraits } from "@/lib/api"
import type { Equipment, Trait } from "@/lib/api-types"
import { getModule } from "@/lib/modules"
import {
  namedTraitTags,
  type DataRecord,
  type RecordStat,
} from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"
import { formatEquipmentCost, formatRangeWithClose } from "@/lib/utils"

const dataset = getModule("equipment")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

function pushStat(
  stats: RecordStat[],
  label: string,
  value: string | null | undefined,
  primary = false
) {
  const trimmed = value?.trim()
  if (!trimmed) return
  stats.push({ label, value: trimmed, primary })
}

function equipmentToRecord(item: Equipment, traits: Trait[]): DataRecord {
  const stats: RecordStat[] = []
  pushStat(stats, "Cost", formatEquipmentCost(item.cost), true)
  pushStat(stats, "TL", item.tl, true)
  pushStat(stats, "DMG", item.dmg, true)
  pushStat(stats, "Range", formatRangeWithClose(item.range), true)
  pushStat(stats, "Mag", item.mag)
  pushStat(stats, "Armour", item.armor)
  pushStat(stats, "Class", item.weaponClassification)
  pushStat(stats, "Category", item.category)

  return {
    id: item.id,
    title: item.name,
    kicker: item.category,
    group: item.type,
    description: item.description,
    stats,
    tags: namedTraitTags(item.trait, traits),
  }
}

export default async function EmporiumPage() {
  const [result, traitsResult, links] = await Promise.all([
    getEquipment(),
    getTraits(),
    buildRuleLinkCatalog(),
  ])

  const traits = traitsResult.data ?? []
  const records: DataRecord[] = [...(result.data ?? [])]
    .sort(
      (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
    )
    .map((item) => equipmentToRecord(item, traits))

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="equipment"
      facetLabel="Type"
      sectionByGroup
      links={links}
    />
  )
}
