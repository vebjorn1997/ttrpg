/**
 * pgTable that contains all conditions. Columns: Id, Name, description, and tags. Tags is an array of text.
 */

import { pgTable, uuid, varchar, text } from 'drizzle-orm/pg-core';

export const conditionsTable = pgTable('conditions', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    traits: uuid().array(),
});