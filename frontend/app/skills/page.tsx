import type { Metadata } from "next"

import { DatasetView } from "@/components/dataset-view"
import { getSkills } from "@/lib/api"
import { getModule } from "@/lib/modules"
import type { DataRecord } from "@/lib/records"
import { buildRuleLinkCatalog } from "@/lib/rule-links-catalog"

const dataset = getModule("skills")

export const metadata: Metadata = {
  title: dataset.title,
  description: dataset.synopsis,
}

export default async function SkillsPage() {
  const [result, links] = await Promise.all([
    getSkills(),
    buildRuleLinkCatalog(),
  ])

  const records: DataRecord[] = (result.data ?? []).map((skill) => {
    const characteristic = skill.primaryCharacteristic.toUpperCase()

    return {
      id: skill.id,
      title: skill.name,
      kicker: characteristic,
      group: characteristic,
      description: skill.description,
    }
  })

  return (
    <DatasetView
      module={dataset}
      error={result.error}
      records={records}
      layout="skills"
      facetLabel="Characteristic"
      sectionByGroup
      links={links}
    />
  )
}
