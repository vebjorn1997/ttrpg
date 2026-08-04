import { integer, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const healingTable = pgTable('healing', {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: varchar({ length: 255 }).notNull().unique(),
    cost: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    tags: text().array(),
});