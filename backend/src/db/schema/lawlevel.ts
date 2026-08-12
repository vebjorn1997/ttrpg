import { uuid, pgTable, varchar, text, integer } from "drizzle-orm/pg-core";

export const lawlevelTable = pgTable('lawlevel', {
    id: uuid('id').primaryKey().defaultRandom(),
    lawlevel: integer('lawlevel').notNull().unique(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text(),
})
