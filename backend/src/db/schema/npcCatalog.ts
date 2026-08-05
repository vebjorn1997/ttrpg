import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const npcCatalogTable = pgTable('npc_catalog', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    difficulty: varchar({ length: 255 }).notNull(),
    movement: varchar({ length: 255 }).notNull(),
    hp: varchar({ length: 255 }).notNull(),
    armor: varchar({ length: 255 }).notNull(),
    features: text().array().notNull(),
    description: text(),
    traits: uuid().array(),
})