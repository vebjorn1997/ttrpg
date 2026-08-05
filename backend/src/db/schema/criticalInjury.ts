/**
 * Critical Injury
 */

import { pgTable, uuid, text, varchar } from 'drizzle-orm/pg-core';

export const criticalInjuryTable = pgTable('critical_injury', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    characteristic: varchar({ length: 255 }).notNull(),
    traits: uuid().array(),
});
