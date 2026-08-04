/**
 * Critical Injury
 */

import { pgTable, integer, text, varchar } from 'drizzle-orm/pg-core';

export const criticalInjuryTable = pgTable('critical_injury', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    characteristic: varchar({ length: 255 }).notNull(),
    tags: text().array(),
});