import "server-only"

/**
 * Cross-module name → deep-link catalog for soft-matching titles in rule text.
 * Built server-side from a single index endpoint.
 */

import { getRuleIndex } from "@/lib/api"
import { dataModules, type DataModule } from "@/lib/modules"
import type { RuleLinkEntry } from "@/lib/rule-links"

function moduleHref(id: DataModule["id"]): string {
  return dataModules.find((module) => module.id === id)?.href ?? "/"
}

function isModuleId(value: string): value is DataModule["id"] {
  return dataModules.some((module) => module.id === value)
}

/** One request instead of fourteen full collection fetches. Failures yield []. */
export async function buildRuleLinkCatalog(): Promise<RuleLinkEntry[]> {
  const index = await getRuleIndex()
  if (!index.ok || !index.data) return []

  return index.data.flatMap((row) => {
    if (!isModuleId(row.module) || !row.id || !row.title) return []
    const base = moduleHref(row.module)
    return [
      {
        id: row.id,
        title: row.title,
        href: `${base}?id=${encodeURIComponent(row.id)}`,
      },
    ]
  })
}
