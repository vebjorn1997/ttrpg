import { uuid, pgTable, varchar, text, primaryKey } from "drizzle-orm/pg-core";
import { featsTable } from "./feats";

export const skillsTable = pgTable('skills', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    description: text(),
    primaryCharacteristic: varchar({ length: 255 }).notNull(),
})

export const skillsFeatsTable = pgTable('skills_feats', {
    skillId: uuid('skill_id').notNull().references(() => skillsTable.id, { onDelete: 'cascade' }),
    featId: uuid('feat_id').notNull().references(() => featsTable.id, { onDelete: 'cascade' }),
},
(t) => [primaryKey({ columns: [t.skillId, t.featId] })],
);