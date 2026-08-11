import { uuid, pgTable, varchar, text, primaryKey } from "drizzle-orm/pg-core";
import { traitsTable } from './traits';

export const featsTable = pgTable('feats', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    type: varchar({ length: 255 }).notNull(),
    prerequisites: text(),
    cost: varchar({ length: 255 }).notNull(),
})

export const featsTraitsTable = pgTable('feats_traits', {
    featId: uuid('feat_id').notNull().references(() => featsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id').notNull().references(() => traitsTable.id, { onDelete: 'cascade' }),
},
(t) => [primaryKey({ columns: [t.featId, t.traitId] })],
);