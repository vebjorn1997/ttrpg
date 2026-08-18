import { sql } from 'drizzle-orm'
import {
  check,
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
    /** Hex colour used on the star-system map, e.g. `#32a852`. */
    color: varchar('color', { length: 7 }).notNull().default('#4a6d8c'),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('factions_hq_idx').on(t.headquartersSystemId),
    check('factions_color_hex', sql`${t.color} ~ '^#[0-9A-Fa-f]{6}$'`),
  ],
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
