/**
 * Client-safe rule-link helpers (types + matching). Catalog building lives in
 * `rule-links-catalog.ts` so `pg` / Better Auth never enter the browser bundle.
 */

export type RuleLinkEntry = {
  id: string
  title: string
  href: string
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
