/**
 * Every campaign entity tags itself from the shared `traits` glossary through a
 * two-column join table. These helpers read and rewrite those links without each
 * route reimplementing the same join.
 */

import { eq, inArray, sql, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { db } from '../db/client'
import { traitsTable } from '../db/schema/traits'

export type TraitRow = typeof traitsTable.$inferSelect

/** Trait rows keyed by the parent entity id, for a batch of parents. */
export async function traitsByParent(
  joinTable: PgTable,
  parentColumn: PgColumn,
  traitColumn: PgColumn,
  parentIds: string[],
): Promise<Map<string, TraitRow[]>> {
  const byParent = new Map<string, TraitRow[]>()
  if (parentIds.length === 0) return byParent

  const rows = await db
    .select({ parentId: sql<string>`${parentColumn}`, trait: traitsTable })
    .from(joinTable)
    .innerJoin(traitsTable, eq(traitsTable.id, traitColumn as PgColumn))
    .where(inArray(parentColumn, parentIds) as SQL)

  for (const { parentId, trait } of rows) {
    const list = byParent.get(parentId)
    if (list) list.push(trait)
    else byParent.set(parentId, [trait])
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  return byParent
}

/** Reject trait ids that do not exist, so links never point at nothing. */
export async function assertTraitsExist(traitIds: string[]): Promise<string | null> {
  if (traitIds.length === 0) return null

  const rows = await db
    .select({ id: traitsTable.id })
    .from(traitsTable)
    .where(inArray(traitsTable.id, traitIds))

  if (rows.length !== traitIds.length) return 'One or more traits do not exist'
  return null
}

/** Replace an entity's trait links with exactly `traitIds`. */
export async function replaceTraitLinks(
  joinTable: PgTable,
  parentColumn: PgColumn,
  parentKey: string,
  traitKey: string,
  parentId: string,
  traitIds: string[],
): Promise<void> {
  await db.delete(joinTable).where(eq(parentColumn, parentId) as SQL)
  if (traitIds.length === 0) return

  await db
    .insert(joinTable)
    .values(
      traitIds.map((traitId) => ({ [parentKey]: parentId, [traitKey]: traitId })),
    )
    .onConflictDoNothing()
}
