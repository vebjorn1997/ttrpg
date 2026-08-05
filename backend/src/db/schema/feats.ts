import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const featsTable = pgTable('feats', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    type: varchar({ length: 255 }).notNull(),
    prerequisites: text(),
    cost: varchar({ length: 255 }).notNull(),
    traits: uuid().array(),
})