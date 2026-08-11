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
  getNpcs,
  getSkills,
  getTraits,
} from "@/lib/api"
import { dataModules, type DataModule } from "@/lib/modules"

export type RuleLinkEntry = {
  id: string
  title: string
  href: string
}

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
      "npcs",
      (npcs.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
    ...entries(
      "traits",
      (traits.data ?? []).map((row) => ({ id: row.id, title: row.name }))
    ),
  ]
}

/** Lookup by lowercase title; longer titles win when building the matcher. */
export function indexRuleLinks(
  catalog: RuleLinkEntry[]
): Map<string, RuleLinkEntry> {
  const map = new Map<string, RuleLinkEntry>()
  for (const entry of catalog) {
    const key = entry.title.trim().toLowerCase()
    if (!key) continue
    // Prefer first occurrence; datasets should not collide on names.
    if (!map.has(key)) map.set(key, entry)
  }
  return map
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
