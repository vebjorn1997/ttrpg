-- Map colours for who holds a hex live on the faction, not hashed on the client.
ALTER TABLE "factions" ADD COLUMN IF NOT EXISTS "color" varchar(7) DEFAULT '#4a6d8c' NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "factions" ADD CONSTRAINT "factions_color_hex" CHECK ("color" ~ '^#[0-9A-Fa-f]{6}$');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
UPDATE "factions" SET "color" = '#c9a227' WHERE "name" = 'Third Imperium' AND "color" = '#4a6d8c';--> statement-breakpoint
UPDATE "factions" SET "color" = '#32a852' WHERE "name" = 'Glitterworld Federation' AND "color" = '#4a6d8c';--> statement-breakpoint
UPDATE "factions" SET "color" = '#b33a2b' WHERE "name" = 'Vor''lekai Horde' AND "color" = '#4a6d8c';--> statement-breakpoint
UPDATE "factions" SET "color" = '#2e8b6a' WHERE "name" = 'Aslan Hierate' AND "color" = '#4a6d8c';
