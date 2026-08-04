/**
 * pgTable that contains all actions and reactions. Three columns, Id, Name, cost, type, and description
 * Id is the primary key, Name is the name of the action, cost is the cost of the action, and description is the description of the action
*/

import { pgTable, integer, varchar, text } from 'drizzle-orm/pg-core';

export const actionsTable = pgTable('actions', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    type: varchar({ length: 255 }).notNull(),
    cost: integer().notNull(),
    description: text().notNull(),
    tags: text().array(),
});