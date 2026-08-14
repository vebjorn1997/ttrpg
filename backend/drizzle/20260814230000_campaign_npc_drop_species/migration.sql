-- Species lives on NPC traits rather than a dedicated column.
ALTER TABLE "campaign_npcs" DROP COLUMN IF EXISTS "species";
