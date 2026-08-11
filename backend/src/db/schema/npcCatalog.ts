import { uuid, pgTable, varchar, text, primaryKey } from "drizzle-orm/pg-core";
import { traitsTable } from './traits';

export const npcCatalogTable = pgTable('npc_catalog', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    movement: varchar({ length: 255 }).notNull(),
    hp: varchar({ length: 255 }).notNull(),
    armor: varchar({ length: 255 }).notNull(),
    features: text().array().notNull(),
    description: text(),
})

export const npcCatalogTraitsTable = pgTable('npc_catalog_traits', {
    npcCatalogId: uuid('npc_catalog_id').notNull().references(() => npcCatalogTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id').notNull().references(() => traitsTable.id, { onDelete: 'cascade' }),
},
(t) => [primaryKey({ columns: [t.npcCatalogId, t.traitId] })],
);