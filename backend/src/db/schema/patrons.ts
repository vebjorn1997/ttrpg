import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { campaignNpcsTable } from './campaignNpcs'
import { user } from './auth'
import type { PaymentRecord, RiskTolerance } from '../../lib/campaign-enums'

/**
 * A patron is an NPC in a hiring role — the same NPC can be a patron here and a
 * target elsewhere, so the patron record is separate from the person.
 */
export const patronsTable = pgTable(
  'patrons',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    npcId: uuid('npc_id')
      .notNull()
      .references(() => campaignNpcsTable.id, { onDelete: 'cascade' }),
    /** -5 (backstabber) through +5 (trustworthy). */
    reputation: integer('reputation').notNull().default(0),
    paymentRecord: varchar('payment_record', { length: 32 })
      .$type<PaymentRecord>()
      .notNull()
      .default('variable'),
    jobTypes: text('job_types').array().notNull().default([]),
    riskTolerance: varchar('risk_tolerance', { length: 32 })
      .$type<RiskTolerance>()
      .notNull()
      .default('moderate'),
    /** GM-facing notes. Never serialised for players or visitors. */
    notes: text('notes'),
    createdBy: text('created_by').references(() => user.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('patrons_npc_idx').on(t.npcId)],
)
