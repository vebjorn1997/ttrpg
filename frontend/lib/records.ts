/**
 * Normalised shape every dataset is mapped into before it reaches the
 * rule browser. Keeping one serialisable record type lets a single Client
 * Component handle search, filtering and list/detail for all catalog
 * endpoints, while each page decides how its columns map onto it.
 */

import type { Trait } from "@/lib/api"

export type RecordTag = {
  label: string
  description?: string | null
  /** Hex colour from the backend `traits` table, if any. */
  color?: string | null
  /** Trait id for deep-linking to the traits glossary. */
  id?: string
}

export type RecordStat = {
  label: string
  value: string
  /** Emphasise this stat in dense readouts. */
  primary?: boolean
}

export type DataRecord = {
  id: string
  title: string
  /** Micro-label above the title, e.g. "REACTION" or "DEX". */
  kicker?: string | null
  /** Value used by the filter chips; must match one of the facet options. */
  group?: string | null
  description?: string | null
  stats?: RecordStat[]
  tags?: RecordTag[]
  /** Free-form lines, used for NPC features. */
  bullets?: string[]
  /** Renders as filled/empty pips, used for action point cost. */
  pips?: { value: number; max: number; label: string } | null
  /** Trait colour swatch for glossary rows. */
  swatch?: string | null
  /**
   * Soft accent wash on the index row / detail pane.
   * Used for basic actions (no feat prerequisite).
   */
  highlight?: boolean
}

/** How the index row and detail panel should present a dataset. */
export type RuleLayout =
  | "actions"
  | "called-shots"
  | "glossary"
  | "feats"
  | "critical-injuries"
  | "healing"
  | "npcs"
  | "skills"
  | "traits"

/** Lookup from trait id to trait, for resolving `traits: uuid[]` columns. */
export function indexTraits(traits: Trait[]): Map<string, Trait> {
  return new Map(traits.map((trait) => [trait.id, trait]))
}

/**
 * Most tables store traits as an array of ids. Resolve them against the traits
 * index, dropping any id the index does not know about.
 */
export function traitTags(
  ids: string[] | null | undefined,
  index: Map<string, Trait>
): RecordTag[] {
  if (!ids?.length) return []

  return ids.flatMap((id) => {
    const trait = index.get(id)
    if (!trait) return []
    return [
      {
        label: trait.name,
        description: trait.description,
        color: trait.color,
        id: trait.id,
      },
    ]
  })
}

/** Flattens a record into one lowercase haystack for substring search. */
export function searchHaystack(record: DataRecord): string {
  return [
    record.title,
    record.kicker,
    record.group,
    record.description,
    ...(record.stats ?? []).flatMap((stat) => [stat.label, stat.value]),
    ...(record.tags ?? []).map((tag) => tag.label),
    ...(record.bullets ?? []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}

/** Distinct `group` values in first-seen order, for the filter chips. */
export function collectGroups(records: DataRecord[]): string[] {
  const seen = new Set<string>()
  for (const record of records) {
    if (record.group) seen.add(record.group)
  }
  return [...seen]
}

/** One-line preview for index rows (strips light markup). */
export function previewText(
  text: string | null | undefined,
  max = 110
): string {
  if (!text) return ""
  const plain = text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^[-•]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim()

  if (plain.length <= max) return plain
  return `${plain.slice(0, max).trimEnd()}…`
}
