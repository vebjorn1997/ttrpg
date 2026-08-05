/**
 * Called Shots
 * Columns: Id, Location, Description, Tags. Tags is an array of text.
 * Location is a text.
 * Description is a text.
 * Tags is an array of text.
 */

import { pgTable, uuid, text, varchar, integer } from 'drizzle-orm/pg-core';

export const calledShotsTable = pgTable('called_shots', {
    id: uuid('id').primaryKey().defaultRandom(),
    location: varchar({ length: 255 }).notNull().unique(),
    cost: integer().notNull(),
    penalty: integer().notNull(),
    description: text().notNull(),
    traits: uuid().array(),
});
