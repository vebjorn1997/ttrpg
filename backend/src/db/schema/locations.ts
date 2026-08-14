import {
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { systemsTable } from './systems'
import { traitsTable } from './traits'
import { user } from './auth'
import type { LocationType } from '../../lib/campaign-enums'

/** In-system places. Unlike the other entities, a location belongs to one system. */
export const locationsTable = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 150 }).notNull(),
    type: varchar('type', { length: 32 })
      .$type<LocationType>()
      .notNull()
      .default('other'),
    description: text('description'),
    /** 0–9 local security rating. */
    securityLevel: integer('security_level'),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('locations_system_name_key').on(t.systemId, t.name)],
)

export const locationTraitsTable = pgTable(
  'location_traits',
  {
    locationId: uuid('location_id')
      .notNull()
      .references(() => locationsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id')
      .notNull()
      .references(() => traitsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.locationId, t.traitId] })],
)
