/**
 * pgTable that contains all conditions. Columns: Id, Name, description, and tags. Tags is an array of text.
 */

import { pgTable, uuid, varchar, text, primaryKey } from 'drizzle-orm/pg-core';
import { traitsTable } from './traits';

export const conditionsTable = pgTable('conditions', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    traits: uuid().array(),
});

export const conditionsTraitsTable = pgTable('conditions_traits', {
    conditionId: uuid('condition_id').notNull().references(() => conditionsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id').notNull().references(() => traitsTable.id, { onDelete: 'cascade' }),
},
(t) => [primaryKey({ columns: [t.conditionId, t.traitId] })],
);