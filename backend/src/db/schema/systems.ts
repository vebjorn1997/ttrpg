import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { tlTable } from './tl'
import { lawlevelTable } from './lawlevel'
import { traitsTable } from './traits'
import { user } from './auth'
import type { Visibility } from '../../lib/campaign-enums'

/**
 * Master registry of star systems. World profile data (starport class, travel
 * zone, gravity, atmosphere) is expressed through the shared `traits` glossary
 * rather than dedicated columns — see the `System` trait type.
 */
export const systemsTable = pgTable(
  'systems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    description: text('description'),
    techLevel: integer('tech_level')
      .notNull()
      .references(() => tlTable.level),
    lawLevel: integer('law_level')
      .notNull()
      .references(() => lawlevelTable.lawlevel),
    /** Hex grid coordinate, stored uppercase, e.g. `0101` or `0A0F`. */
    location: varchar('location', { length: 4 }).notNull().unique(),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [check('systems_location_hex', sql`${t.location} ~ '^[0-9A-F]{4}$'`)],
)

export const systemTraitsTable = pgTable(
  'system_traits',
  {
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id')
      .notNull()
      .references(() => traitsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.systemId, t.traitId] })],
)

/** Adventure hooks. Players see unused, public hooks only. */
export const systemHooksTable = pgTable(
  'system_hooks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 200 }).notNull(),
    description: text('description'),
    used: boolean('used').notNull().default(false),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('system_hooks_system_idx').on(t.systemId)],
)

/**
 * The traveller log — what the party did here. Any player may file entries and
 * edit their own; the GM may edit all.
 */
export const systemInteractionsTable = pgTable(
  'system_interactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    /** Original operator input, so stardates redisplay as they were typed. */
    entryDateRaw: varchar('entry_date_raw', { length: 32 }),
    event: text('event').notNull(),
    recordedBy: text('recorded_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('system_interactions_system_idx').on(t.systemId)],
)

/** Historical events for the system. GM-authored, visibility per event. */
export const systemTimelineTable = pgTable(
  'system_timeline',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    entryDate: date('entry_date', { mode: 'string' }).notNull(),
    entryDateRaw: varchar('entry_date_raw', { length: 32 }),
    event: text('event').notNull(),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('system_timeline_system_idx').on(t.systemId)],
)
