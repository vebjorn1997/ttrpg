import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getEquipment } from "@/lib/api"
import type { Equipment } from "@/lib/api-types"
import { getModule } from "@/lib/modules"
import type { DataRecord, RecordStat, RecordTag } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"

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

function traitTags(trait: string | null): RecordTag[] {
  if (!trait?.trim()) return []
  return trait
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((label) => ({ label }))
}

function equipmentToRecord(item: Equipment): DataRecord {
  const stats: RecordStat[] = []
  pushStat(stats, "Cost", item.cost, true)
  pushStat(stats, "TL", item.tl, true)
  pushStat(stats, "DMG", item.dmg, true)
  pushStat(stats, "Range", item.range, true)
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
    tags: traitTags(item.trait),
  }
}

export default async function EmporiumPage() {
  const [result, links] = await Promise.all([
    getEquipment(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = [...(result.data ?? [])]
    .sort(
      (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name)
    )
    .map(equipmentToRecord)

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
