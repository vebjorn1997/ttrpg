/**
 * pgTable that contains all conditions. Columns: Id, Name, description, and tags. Tags is an array of text.
 */

import { pgTable, integer, varchar, text } from 'drizzle-orm/pg-core';

export const conditionsTable = pgTable('conditions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    tags: text().array(),
});