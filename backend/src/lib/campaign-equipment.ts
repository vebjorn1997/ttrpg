/**
 * Campaign characters pick catalog gear the same way player sheets do: a
 * junction row per item, with a quantity. Helpers keep the join out of each
 * route that serialises an NPC.
 */

import { eq, inArray } from 'drizzle-orm'
import { db } from '../db/client'
import { campaignNpcEquipmentTable } from '../db/schema/campaignNpcs'
import { equipmentTable } from '../db/schema/equipment'

export type NpcEquipmentItem = typeof equipmentTable.$inferSelect & {
  quantity: number
}

export type EquipmentLoadoutEntry = {
  equipmentId: string
  quantity: number
}

/** Catalog rows keyed by NPC id, for a batch of characters. */
export async function equipmentByNpc(
  npcIds: string[],
): Promise<Map<string, NpcEquipmentItem[]>> {
  const byNpc = new Map<string, NpcEquipmentItem[]>()
  if (npcIds.length === 0) return byNpc

  const rows = await db
    .select({
      npcId: campaignNpcEquipmentTable.npcId,
      item: equipmentTable,
      quantity: campaignNpcEquipmentTable.quantity,
    })
    .from(campaignNpcEquipmentTable)
    .innerJoin(
      equipmentTable,
      eq(equipmentTable.id, campaignNpcEquipmentTable.equipmentId),
    )
    .where(inArray(campaignNpcEquipmentTable.npcId, npcIds))

  for (const { npcId, item, quantity } of rows) {
    const entry = { ...item, quantity }
    const list = byNpc.get(npcId)
    if (list) list.push(entry)
    else byNpc.set(npcId, [entry])
  }

  for (const list of byNpc.values()) {
    list.sort(
      (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name),
    )
  }

  return byNpc
}

/** Reject equipment ids that do not exist, so links never point at nothing. */
export async function assertEquipmentExists(
  equipmentIds: string[],
): Promise<string | null> {
  if (equipmentIds.length === 0) return null

  const unique = [...new Set(equipmentIds)]
  const rows = await db
    .select({ id: equipmentTable.id })
    .from(equipmentTable)
    .where(inArray(equipmentTable.id, unique))

  if (rows.length !== unique.length) return 'One or more equipment ids do not exist'
  return null
}

/** Replace an NPC's loadout with exactly `loadout`. */
export async function replaceNpcEquipment(
  npcId: string,
  loadout: EquipmentLoadoutEntry[],
): Promise<void> {
  await db
    .delete(campaignNpcEquipmentTable)
    .where(eq(campaignNpcEquipmentTable.npcId, npcId))

  if (loadout.length === 0) return

  await db.insert(campaignNpcEquipmentTable).values(
    loadout.map((entry) => ({
      npcId,
      equipmentId: entry.equipmentId,
      quantity: entry.quantity,
    })),
  )
}
