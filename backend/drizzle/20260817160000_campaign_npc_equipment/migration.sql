-- Catalog gear carried by named campaign characters.
CREATE TABLE IF NOT EXISTS "campaign_npc_equipment" (
	"npc_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "campaign_npc_equipment_npc_id_equipment_id_pk" PRIMARY KEY("npc_id","equipment_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_npc_equipment" ADD CONSTRAINT "campaign_npc_equipment_npc_id_campaign_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."campaign_npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_npc_equipment" ADD CONSTRAINT "campaign_npc_equipment_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
