-- Who holds a hex is a first-class link, distinct from faction presence.
ALTER TABLE "systems" ADD COLUMN IF NOT EXISTS "controller_faction_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "systems" ADD CONSTRAINT "systems_controller_faction_id_factions_id_fk" FOREIGN KEY ("controller_faction_id") REFERENCES "public"."factions"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "systems_controller_idx" ON "systems" USING btree ("controller_faction_id");
