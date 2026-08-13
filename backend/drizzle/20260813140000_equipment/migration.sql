CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"cost" varchar(255),
	"category" varchar(255) NOT NULL,
	"type" varchar(255) NOT NULL,
	"trait" varchar(255),
	"weapon_classification" varchar(255),
	"description" text,
	"tl" varchar(255),
	"dmg" varchar(255),
	"armor" varchar(255),
	"mag" varchar(255),
	"range" varchar(255),
	CONSTRAINT "equipment_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "character_equipment" (
	"character_id" uuid NOT NULL,
	"equipment_id" uuid NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "character_equipment_character_id_equipment_id_pk" PRIMARY KEY("character_id","equipment_id")
);
--> statement-breakpoint
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_character_id_characters_id_fk" FOREIGN KEY ("character_id") REFERENCES "public"."characters"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "character_equipment" ADD CONSTRAINT "character_equipment_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;
