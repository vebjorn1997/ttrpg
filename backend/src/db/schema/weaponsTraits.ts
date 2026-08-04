/**
 * Weapons Traits
 */

import { pgTable, integer, text, varchar } from 'drizzle-orm/pg-core';

export const weaponsTraitsTable = pgTable('weapons_traits', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    tags: text().array(),
});