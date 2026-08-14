import {
  index,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { systemsTable } from './systems'
import { factionsTable } from './factions'
import { traitsTable } from './traits'
import { user } from './auth'
import type { NpcStatus } from '../../lib/campaign-enums'

/**
 * Named campaign characters. Distinct from `npc_catalog`, which holds generic
 * stat blocks for encounters.
 */
export const campaignNpcsTable = pgTable(
  'campaign_npcs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    occupation: varchar('occupation', { length: 100 }),
    /** Traveller universal personality profile, e.g. `7A8A99`. */
    upp: varchar('upp', { length: 6 }),
    description: text('description'),
    currentLocationSystemId: uuid('current_location_system_id').references(
      () => systemsTable.id,
      { onDelete: 'set null' },
    ),
    status: varchar('status', { length: 32 }).$type<NpcStatus>().notNull().default('alive'),
    allegianceFactionId: uuid('allegiance_faction_id').references(
      () => factionsTable.id,
      { onDelete: 'set null' },
    ),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('campaign_npcs_location_idx').on(t.currentLocationSystemId),
    index('campaign_npcs_faction_idx').on(t.allegianceFactionId),
  ],
)

export const campaignNpcTraitsTable = pgTable(
  'campaign_npc_traits',
  {
    npcId: uuid('npc_id')
      .notNull()
      .references(() => campaignNpcsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id')
      .notNull()
      .references(() => traitsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.npcId, t.traitId] })],
)
