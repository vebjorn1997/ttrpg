import { uuid, pgTable, varchar, text } from "drizzle-orm/pg-core";

export const equipmentTable = pgTable('equipment', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: varchar({ length: 255 }).notNull().unique(),
    cost: varchar({ length: 255 }),
    category: varchar({ length: 255 }).notNull(),
    type: varchar({ length: 255 }).notNull(),
    trait: varchar({ length: 255 }),
    weaponClassification: varchar('weapon_classification', { length: 255 }),
    description: text(),
    tl: varchar({ length: 255 }),
    dmg: varchar({ length: 255 }),
    armor: varchar({ length: 255 }),
    mag: varchar({ length: 255 }),
    range: varchar({ length: 255 }),
})
