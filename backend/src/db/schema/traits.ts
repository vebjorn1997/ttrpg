import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const traitsTable = pgTable('traits', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    color: varchar({ length: 255 }).notNull().default('#420D09'),
    description: text().notNull()
})