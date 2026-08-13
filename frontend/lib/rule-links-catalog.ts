import "server-only"

/**
 * Cross-module name → deep-link catalog for soft-matching titles in rule text.
 * Built server-side from live collections; matching is case-insensitive.
 */

import {
  getActions,
  getCalledShots,
  getConditions,
  getCriticalInjuries,
  getFeats,
  getHealing,
  getLanguages,
  getLawLevels,
  getMiscellaneous,
  getNpcs,
  getSkills,
  getTechLevels,
  getTraits,
} from "@/lib/api"
import { dataModules, type DataModule } from "@/lib/modules"
import type { RuleLinkEntry } from "@/lib/rule-links"

function moduleHref(id: DataModule["id"]): string {
  return dataModules.find((module) => module.id === id)?.href ?? "/"
}

function entries(
  moduleId: DataModule["id"],
  rows: { id: string; title: string }[]
): RuleLinkEntry[] {
  const base = moduleHref(moduleId)
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: `${base}?id=${encodeURIComponent(row.id)}`,
  }))
}

/** Parallel fetch of every named rule for cross-linking. Failures yield []. */
export async function buildRuleLinkCatalog(): Promise<RuleLinkEntry[]> {
  const [
    actions,
    conditions,
    calledShots,
    injuries,
    healing,
    feats,
    skills,
    techLevels,
    languages,
    lawLevels,
    miscellaneous,
    npcs,
    traits,
  ] = await Promise.all([
    getActions(),
    getConditions(),
    getCalledShots(),
    getCriticalInjuries(),
    getHealing(),
    getFeats(),
    getSkills(),
    getTechLevels(),
    getLanguages(),
    getLawLevels(),
    getMiscellaneous(),
    getNpcs(),
    getTraits(),
  ])

  return [
    ...entries(
      "actions",
      (actions.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "conditions",
      (conditions.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "called-shots",
      (calledShots.data ?? []).map((row) => ({
        id: row.id,
        title: row.location,
      }))
    ),
    ...entries(
      "critical-injuries",
      (injuries.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "healing",
      (healing.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "feats",
      (feats.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "skills",
      (skills.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "tl",
      (techLevels.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "languages",
      (languages.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "lawlevel",
      (lawLevels.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "miscellaneous",
      (miscellaneous.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "npcs",
      (npcs.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "traits",
      (traits.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
  ]
}
