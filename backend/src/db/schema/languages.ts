import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const languagesTable = pgTable('languages', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text(),
})
