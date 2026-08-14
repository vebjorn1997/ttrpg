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
import { campaignNpcsTable } from './campaignNpcs'
import { traitsTable } from './traits'
import { user } from './auth'
import type { ShipStatus } from '../../lib/campaign-enums'

/** Named vessels. A ship may be owned by a faction, an NPC, or neither. */
export const shipsTable = pgTable(
  'ships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull(),
    type: varchar('type', { length: 100 }),
    registration: varchar('registration', { length: 50 }),
    ownerFactionId: uuid('owner_faction_id').references(() => factionsTable.id, {
      onDelete: 'set null',
    }),
    ownerNpcId: uuid('owner_npc_id').references(() => campaignNpcsTable.id, {
      onDelete: 'set null',
    }),
    currentSystemId: uuid('current_system_id').references(() => systemsTable.id, {
      onDelete: 'set null',
    }),
    status: varchar('status', { length: 32 })
      .$type<ShipStatus>()
      .notNull()
      .default('active'),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('ships_current_system_idx').on(t.currentSystemId)],
)

export const shipTraitsTable = pgTable(
  'ship_traits',
  {
    shipId: uuid('ship_id')
      .notNull()
      .references(() => shipsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id')
      .notNull()
      .references(() => traitsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.shipId, t.traitId] })],
)
