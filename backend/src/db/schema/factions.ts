import {
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { systemsTable } from './systems'
import { traitsTable } from './traits'
import { user } from './auth'
import type { FactionType } from '../../lib/campaign-enums'

/** Governments, corporations, cults and gangs. Exists independently of systems. */
export const factionsTable = pgTable(
  'factions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 150 }).notNull().unique(),
    type: varchar('type', { length: 32 }).$type<FactionType>().notNull().default('other'),
    description: text('description'),
    /** Power scale: 1 (local gang) through 5 (sector-spanning). */
    tier: integer('tier'),
    headquartersSystemId: uuid('headquarters_system_id').references(
      () => systemsTable.id,
      { onDelete: 'set null' },
    ),
    goals: text('goals'),
    assets: text('assets').array().notNull().default([]),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('factions_hq_idx').on(t.headquartersSystemId)],
)

export const factionTraitsTable = pgTable(
  'faction_traits',
  {
    factionId: uuid('faction_id')
      .notNull()
      .references(() => factionsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id')
      .notNull()
      .references(() => traitsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.factionId, t.traitId] })],
)
