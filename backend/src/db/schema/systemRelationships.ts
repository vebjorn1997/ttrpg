import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { systemsTable } from './systems'
import { factionsTable } from './factions'
import { campaignNpcsTable } from './campaignNpcs'
import { shipsTable } from './ships'
import { patronsTable } from './patrons'
import { locationsTable } from './locations'
import { user } from './auth'
import type {
  JobDifficulty,
  LegalStatus,
  NpcConnectionType,
  PartyRelationship,
  PatronAvailability,
  PresenceType,
  ShipVisitPurpose,
  ShipVisitStatus,
  SystemLinkType,
  Visibility,
} from '../../lib/campaign-enums'

/** How a faction is present in a system. One record per faction per system. */
export const systemFactionsTable = pgTable(
  'system_factions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    factionId: uuid('faction_id')
      .notNull()
      .references(() => factionsTable.id, { onDelete: 'cascade' }),
    presenceType: varchar('presence_type', { length: 32 })
      .$type<PresenceType>()
      .notNull(),
    /** 0 (none) through 5 (absolute control). */
    influence: integer('influence').notNull().default(3),
    relationshipToParty: varchar('relationship_to_party', { length: 32 })
      .$type<PartyRelationship>()
      .notNull()
      .default('neutral'),
    notes: text('notes'),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('system_factions_system_faction_key').on(t.systemId, t.factionId),
    index('system_factions_system_idx').on(t.systemId),
    index('system_factions_faction_idx').on(t.factionId),
  ],
)

/** An NPC's tie to a system. The same NPC may have several across time. */
export const systemNpcsTable = pgTable(
  'system_npcs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    npcId: uuid('npc_id')
      .notNull()
      .references(() => campaignNpcsTable.id, { onDelete: 'cascade' }),
    connectionType: varchar('connection_type', { length: 32 })
      .$type<NpcConnectionType>()
      .notNull(),
    currentStatus: varchar('current_status', { length: 100 }),
    arrivalDate: date('arrival_date', { mode: 'string' }),
    /** Null means they are still here. */
    departureDate: date('departure_date', { mode: 'string' }),
    notes: text('notes'),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('system_npcs_system_idx').on(t.systemId),
    index('system_npcs_npc_idx').on(t.npcId),
  ],
)

/** A ship's visit to a system, optionally docked at a known location. */
export const systemShipsTable = pgTable(
  'system_ships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    shipId: uuid('ship_id')
      .notNull()
      .references(() => shipsTable.id, { onDelete: 'cascade' }),
    dockedAtLocationId: uuid('docked_at_location_id').references(
      () => locationsTable.id,
      { onDelete: 'set null' },
    ),
    arrivalDate: date('arrival_date', { mode: 'string' }),
    departureDate: date('departure_date', { mode: 'string' }),
    purpose: varchar('purpose', { length: 32 }).$type<ShipVisitPurpose>(),
    status: varchar('status', { length: 32 })
      .$type<ShipVisitStatus>()
      .notNull()
      .default('docked'),
    notes: text('notes'),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('system_ships_system_idx').on(t.systemId),
    index('system_ships_ship_idx').on(t.shipId),
  ],
)

/** A job on offer in a system, posted by a patron. */
export const systemPatronsTable = pgTable(
  'system_patrons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    systemId: uuid('system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    patronId: uuid('patron_id')
      .notNull()
      .references(() => patronsTable.id, { onDelete: 'cascade' }),
    availability: varchar('availability', { length: 32 })
      .$type<PatronAvailability>()
      .notNull()
      .default('available'),
    jobSummary: text('job_summary'),
    reward: varchar('reward', { length: 200 }),
    difficulty: varchar('difficulty', { length: 32 }).$type<JobDifficulty>(),
    legalStatus: varchar('legal_status', { length: 32 }).$type<LegalStatus>(),
    notes: text('notes'),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('system_patrons_system_idx').on(t.systemId),
    index('system_patrons_patron_idx').on(t.patronId),
  ],
)

/** Directed links between two systems: trade routes, wars, protectorates. */
export const systemLinksTable = pgTable(
  'system_systems',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromSystemId: uuid('from_system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    toSystemId: uuid('to_system_id')
      .notNull()
      .references(() => systemsTable.id, { onDelete: 'cascade' }),
    relationshipType: varchar('relationship_type', { length: 32 })
      .$type<SystemLinkType>()
      .notNull(),
    /** 1 (weak) through 5 (dominant). */
    strength: integer('strength').notNull().default(2),
    active: boolean('active').notNull().default(true),
    notes: text('notes'),
    visibility: varchar('visibility', { length: 16 })
      .$type<Visibility>()
      .notNull()
      .default('public'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique('system_systems_pair_type_key').on(
      t.fromSystemId,
      t.toSystemId,
      t.relationshipType,
    ),
    check('system_systems_no_self_link', sql`${t.fromSystemId} <> ${t.toSystemId}`),
    index('system_systems_from_idx').on(t.fromSystemId),
    index('system_systems_to_idx').on(t.toSystemId),
  ],
)
