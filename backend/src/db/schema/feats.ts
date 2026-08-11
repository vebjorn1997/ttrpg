import { uuid, pgTable, varchar, text, primaryKey, jsonb } from "drizzle-orm/pg-core";
import { traitsTable } from './traits';
import type { FeatRequirement } from '../../lib/feat-requirements';

export const featsTable = pgTable('feats', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text().notNull(),
    type: varchar({ length: 255 }).notNull(),
    /** Human-readable prerequisite line for rules browser / sheets. */
    prerequisites: text(),
    /** Structured AST used for eligibility checks. */
    requirements: jsonb('requirements').$type<FeatRequirement | null>(),
    cost: varchar({ length: 255 }).notNull(),
})

export const featsTraitsTable = pgTable('feats_traits', {
    featId: uuid('feat_id').notNull().references(() => featsTable.id, { onDelete: 'cascade' }),
    traitId: uuid('trait_id').notNull().references(() => traitsTable.id, { onDelete: 'cascade' }),
},
(t) => [primaryKey({ columns: [t.featId, t.traitId] })],
);
