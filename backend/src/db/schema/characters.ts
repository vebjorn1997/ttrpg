import {
  uuid,
  pgTable,
  varchar,
  text,
  integer,
  jsonb,
  timestamp,
  primaryKey,
} from 'drizzle-orm/pg-core'
import { featsTable } from './feats'
import { conditionsTable } from './conditions'
import { criticalInjuryTable } from './criticalInjury'
import { equipmentTable } from './equipment'

export type CharacterSkill = {
  name: string
  level: number
  /** Set when `name` is Language — which tongue this rating applies to. */
  language?: string | null
}

export const charactersTable = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** Better Auth `user.id` (text). Null = orphan (admin-only until claimed). */
  userId: text('user_id'),
  name: varchar({ length: 255 }).notNull(),
  playerName: varchar('player_name', { length: 255 }),
  strMax: integer('str_max').notNull(),
  strCurrent: integer('str_current').notNull(),
  dexMax: integer('dex_max').notNull(),
  dexCurrent: integer('dex_current').notNull(),
  endMax: integer('end_max').notNull(),
  endCurrent: integer('end_current').notNull(),
  int: integer('int').notNull().default(0),
  soc: integer('soc').notNull().default(0),
  edu: integer('edu').notNull().default(0),
  skills: jsonb('skills').$type<CharacterSkill[]>().notNull().default([]),
  movement: varchar({ length: 255 }),
  armorTotal: integer('armor_total').notNull().default(0),
  armorBottom: varchar('armor_bottom', { length: 255 }),
  armorTop: varchar('armor_top', { length: 255 }),
  armorOuter: varchar('armor_outer', { length: 255 }),
  weapons: text('weapons').array().notNull().default([]),
  equipment: text('equipment').array().notNull().default([]),
  credits: integer('credits').notNull().default(0),
  experience: integer('experience').notNull().default(0),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const characterFeatsTable = pgTable(
  'character_feats',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    featId: uuid('feat_id')
      .notNull()
      .references(() => featsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.featId] })],
)

export const characterConditionsTable = pgTable(
  'character_conditions',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    conditionId: uuid('condition_id')
      .notNull()
      .references(() => conditionsTable.id, { onDelete: 'cascade' }),
    value: integer('value'),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.conditionId] })],
)

export const characterCriticalInjuriesTable = pgTable(
  'character_critical_injuries',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    criticalInjuryId: uuid('critical_injury_id')
      .notNull()
      .references(() => criticalInjuryTable.id, { onDelete: 'cascade' }),
    notes: text('notes'),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.criticalInjuryId] })],
)

export const characterEquipmentTable = pgTable(
  'character_equipment',
  {
    characterId: uuid('character_id')
      .notNull()
      .references(() => charactersTable.id, { onDelete: 'cascade' }),
    equipmentId: uuid('equipment_id')
      .notNull()
      .references(() => equipmentTable.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.characterId, t.equipmentId] })],
)
