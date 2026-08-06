/**
 * pgTable that contains all actions and reactions. Three columns, Id, Name, cost, type, and description
 * Id is the primary key, Name is the name of the action, cost is the cost of the action, and description is the description of the action
*/

import { pgTable, uuid, integer, varchar, text } from 'drizzle-orm/pg-core';
import { primaryKey } from 'drizzle-orm/pg-core';

import { featsTable } from './feats';
import { traitsTable } from './traits';

export const actionsTable = pgTable('actions', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    type: varchar({ length: 255 }).notNull(),
    cost: integer().notNull(),
    description: text().notNull(),
    requiredFeatId: uuid('required_feat_id').references(() => featsTable.id, { onDelete: 'set null' }),
});

export const actionsTraitsTable = pgTable('action_traits', {
    actionId: uuid('action_id').notNull().references(() => actionsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id').notNull().references(() => traitsTable.id, { onDelete: 'cascade' }),
},
(t) => [primaryKey({ columns: [t.actionId, t.traitId] })],
);