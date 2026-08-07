CREATE TABLE "action_traits" (
	"action_id" uuid,
	"trait_id" uuid,
	CONSTRAINT "action_traits_pkey" PRIMARY KEY("action_id","trait_id")
);
--> statement-breakpoint
CREATE TABLE "character_conditions" (
	"character_id" uuid,
	"condition_id" uuid,
	"value" integer,
	CONSTRAINT "character_conditions_pkey" PRIMARY KEY("character_id","condition_id")
);
--> statement-breakpoint
CREATE TABLE "character_critical_injuries" (
	"character_id" uuid,
	"critical_injury_id" uuid,
	"notes" text,
	CONSTRAINT "character_critical_injuries_pkey" PRIMARY KEY("character_id","critical_injury_id")
);
--> statement-breakpoint
CREATE TABLE "character_feats" (
	"character_id" uuid,
	"feat_id" uuid,
	CONSTRAINT "character_feats_pkey" PRIMARY KEY("character_id","feat_id")
);
--> statement-breakpoint
CREATE TABLE "characters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL,
	"player_name" varchar(255),
	"str_max" integer NOT NULL,
	"str_current" integer NOT NULL,
	"dex_max" integer NOT NULL,
	"dex_current" integer NOT NULL,
	"end_max" integer NOT NULL,
	"end_current" integer NOT NULL,
	"int" integer DEFAULT 0 NOT NULL,
	"soc" integer DEFAULT 0 NOT NULL,
	"edu" integer DEFAULT 0 NOT NULL,
	"skills" jsonb DEFAULT '[]' NOT NULL,
	"movement" varchar(255),
	"armor_total" integer DEFAULT 0 NOT NULL,
	"armor_bottom" varchar(255),
	"armor_top" varchar(255),
	"armor_outer" varchar(255),
	"weapons" text[] DEFAULT '{}'::text[] NOT NULL,
	"equipment" text[] DEFAULT '{}'::text[] NOT NULL,
	"credits" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conditions_traits" (
	"condition_id" uuid,
	"trait_id" uuid,
	CONSTRAINT "conditions_traits_pkey" PRIMARY KEY("condition_id","trait_id")
);
--> statement-breakpoint
CREATE TABLE "feats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"description" text NOT NULL,
	"type" varchar(255) NOT NULL,
	"prerequisites" text,
	"cost" varchar(255) NOT NULL,
	"traits" uuid[]
);
--> statement-breakpoint
CREATE TABLE "feats_traits" (
	"feat_id" uuid,
	"trait_id" uuid,
	CONSTRAINT "feats_traits_pkey" PRIMARY KEY("feat_id","trait_id")
);
--> statement-breakpoint
CREATE TABLE "npc_catalog" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"movement" varchar(255) NOT NULL,
	"hp" varchar(255) NOT NULL,
	"armor" varchar(255) NOT NULL,
	"features" text[] NOT NULL,
	"description" text,
	"traits" uuid[]
);
--> statement-breakpoint
CREATE TABLE "npc_catalog_traits" (
	"npc_catalog_id" uuid,
	"trait_id" uuid,
	CONSTRAINT "npc_catalog_traits_pkey" PRIMARY KEY("npc_catalog_id","trait_id")
);
--> statement-breakpoint
CREATE TABLE "traits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"name" varchar(255) NOT NULL UNIQUE,
	"color" varchar(255) DEFAULT '#420D09' NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
DROP TABLE "weapons_traits";--> statement-breakpoint
ALTER TABLE "actions" ADD COLUMN "required_feat_id" uuid;--> statement-breakpoint
ALTER TABLE "called_shots" ADD COLUMN "traits" uuid[];--> statement-breakpoint
ALTER TABLE "conditions" ADD COLUMN "traits" uuid[];--> statement-breakpoint
ALTER TABLE "critical_injury" ADD COLUMN "traits" uuid[];--> statement-breakpoint
ALTER TABLE "healing" ADD COLUMN "traits" uuid[];--> statement-breakpoint
ALTER TABLE "called_shots" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "conditions" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "critical_injury" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "healing" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "actions" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "called_shots" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "called_shots" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "called_shots" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "conditions" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "conditions" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "conditions" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "critical_injury" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "critical_injury" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "critical_injury" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "healing" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "healing" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "healing" ALTER COLUMN "id" DROP IDENTITY;--> statement-breakpoint
ALTER TABLE "actions" ADD CONSTRAINT "actions_required_feat_id_feats_id_fkey" FOREIGN KEY ("required_feat_id") REFERENCES "feats"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "action_traits" ADD CONSTRAINT "action_traits_action_id_actions_id_fkey" FOREIGN KEY ("action_id") REFERENCES "actions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "action_traits" ADD CONSTRAINT "action_traits_trait_id_traits_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_conditions" ADD CONSTRAINT "character_conditions_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_conditions" ADD CONSTRAINT "character_conditions_condition_id_conditions_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_critical_injuries" ADD CONSTRAINT "character_critical_injuries_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_critical_injuries" ADD CONSTRAINT "character_critical_injuries_B78hEotx1fQx_fkey" FOREIGN KEY ("critical_injury_id") REFERENCES "critical_injury"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_feats" ADD CONSTRAINT "character_feats_character_id_characters_id_fkey" FOREIGN KEY ("character_id") REFERENCES "characters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "character_feats" ADD CONSTRAINT "character_feats_feat_id_feats_id_fkey" FOREIGN KEY ("feat_id") REFERENCES "feats"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conditions_traits" ADD CONSTRAINT "conditions_traits_condition_id_conditions_id_fkey" FOREIGN KEY ("condition_id") REFERENCES "conditions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "conditions_traits" ADD CONSTRAINT "conditions_traits_trait_id_traits_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "feats_traits" ADD CONSTRAINT "feats_traits_feat_id_feats_id_fkey" FOREIGN KEY ("feat_id") REFERENCES "feats"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "feats_traits" ADD CONSTRAINT "feats_traits_trait_id_traits_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "npc_catalog_traits" ADD CONSTRAINT "npc_catalog_traits_npc_catalog_id_npc_catalog_id_fkey" FOREIGN KEY ("npc_catalog_id") REFERENCES "npc_catalog"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "npc_catalog_traits" ADD CONSTRAINT "npc_catalog_traits_trait_id_traits_id_fkey" FOREIGN KEY ("trait_id") REFERENCES "traits"("id") ON DELETE CASCADE;