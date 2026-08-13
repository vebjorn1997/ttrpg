import { uuid, pgTable, varchar, text, integer } from "drizzle-orm/pg-core";

export const miscellaneousTable = pgTable('miscellaneous', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    sort: integer('sort').notNull(),
    description: text(),
})
