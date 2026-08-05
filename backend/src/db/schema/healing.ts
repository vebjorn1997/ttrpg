import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const healingTable = pgTable('healing', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    cost: varchar({ length: 255 }).notNull(),
    description: text().notNull(),
    traits: uuid().array(),
});