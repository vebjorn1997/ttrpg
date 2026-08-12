import { uuid, pgTable, varchar, text, integer } from "drizzle-orm/pg-core";

export const tlTable = pgTable('tl', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    level: integer('level').notNull().unique(),
    description: text(),
})
