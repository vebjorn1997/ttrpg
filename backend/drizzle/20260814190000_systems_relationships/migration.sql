-- Systems database & relationships module.

CREATE TABLE IF NOT EXISTS "systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"tech_level" integer NOT NULL,
	"law_level" integer NOT NULL,
	"location" varchar(4) NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "systems_name_unique" UNIQUE("name"),
	CONSTRAINT "systems_location_unique" UNIQUE("location"),
	CONSTRAINT "systems_location_hex" CHECK ("location" ~ '^[0-9A-F]{4}$')
);
--> statement-breakpoint
ALTER TABLE "systems" ADD CONSTRAINT "systems_tech_level_tl_level_fk" FOREIGN KEY ("tech_level") REFERENCES "public"."tl"("level") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "systems" ADD CONSTRAINT "systems_law_level_lawlevel_lawlevel_fk" FOREIGN KEY ("law_level") REFERENCES "public"."lawlevel"("lawlevel") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "systems" ADD CONSTRAINT "systems_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_traits" (
	"system_id" uuid NOT NULL,
	"trait_id" uuid NOT NULL,
	CONSTRAINT "system_traits_system_id_trait_id_pk" PRIMARY KEY("system_id","trait_id")
);
--> statement-breakpoint
ALTER TABLE "system_traits" ADD CONSTRAINT "system_traits_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_traits" ADD CONSTRAINT "system_traits_trait_id_traits_id_fk" FOREIGN KEY ("trait_id") REFERENCES "public"."traits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_hooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"description" text,
	"used" boolean DEFAULT false NOT NULL,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_hooks" ADD CONSTRAINT "system_hooks_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_hooks" ADD CONSTRAINT "system_hooks_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_hooks_system_idx" ON "system_hooks" USING btree ("system_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"entry_date_raw" varchar(32),
	"event" text NOT NULL,
	"recorded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_interactions" ADD CONSTRAINT "system_interactions_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_interactions" ADD CONSTRAINT "system_interactions_recorded_by_user_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_interactions_system_idx" ON "system_interactions" USING btree ("system_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"entry_date" date NOT NULL,
	"entry_date_raw" varchar(32),
	"event" text NOT NULL,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_timeline" ADD CONSTRAINT "system_timeline_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_timeline" ADD CONSTRAINT "system_timeline_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_timeline_system_idx" ON "system_timeline" USING btree ("system_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "factions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" varchar(32) DEFAULT 'other' NOT NULL,
	"description" text,
	"tier" integer,
	"headquarters_system_id" uuid,
	"goals" text,
	"assets" text[] DEFAULT '{}'::text[] NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "factions_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "factions" ADD CONSTRAINT "factions_headquarters_system_id_systems_id_fk" FOREIGN KEY ("headquarters_system_id") REFERENCES "public"."systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "factions" ADD CONSTRAINT "factions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "factions_hq_idx" ON "factions" USING btree ("headquarters_system_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "faction_traits" (
	"faction_id" uuid NOT NULL,
	"trait_id" uuid NOT NULL,
	CONSTRAINT "faction_traits_faction_id_trait_id_pk" PRIMARY KEY("faction_id","trait_id")
);
--> statement-breakpoint
ALTER TABLE "faction_traits" ADD CONSTRAINT "faction_traits_faction_id_factions_id_fk" FOREIGN KEY ("faction_id") REFERENCES "public"."factions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faction_traits" ADD CONSTRAINT "faction_traits_trait_id_traits_id_fk" FOREIGN KEY ("trait_id") REFERENCES "public"."traits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_npcs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"occupation" varchar(100),
	"upp" varchar(6),
	"description" text,
	"current_location_system_id" uuid,
	"status" varchar(32) DEFAULT 'alive' NOT NULL,
	"allegiance_faction_id" uuid,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_npcs" ADD CONSTRAINT "campaign_npcs_current_location_system_id_systems_id_fk" FOREIGN KEY ("current_location_system_id") REFERENCES "public"."systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_npcs" ADD CONSTRAINT "campaign_npcs_allegiance_faction_id_factions_id_fk" FOREIGN KEY ("allegiance_faction_id") REFERENCES "public"."factions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_npcs" ADD CONSTRAINT "campaign_npcs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_npcs_location_idx" ON "campaign_npcs" USING btree ("current_location_system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "campaign_npcs_faction_idx" ON "campaign_npcs" USING btree ("allegiance_faction_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "campaign_npc_traits" (
	"npc_id" uuid NOT NULL,
	"trait_id" uuid NOT NULL,
	CONSTRAINT "campaign_npc_traits_npc_id_trait_id_pk" PRIMARY KEY("npc_id","trait_id")
);
--> statement-breakpoint
ALTER TABLE "campaign_npc_traits" ADD CONSTRAINT "campaign_npc_traits_npc_id_campaign_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."campaign_npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_npc_traits" ADD CONSTRAINT "campaign_npc_traits_trait_id_traits_id_fk" FOREIGN KEY ("trait_id") REFERENCES "public"."traits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" varchar(100),
	"registration" varchar(50),
	"owner_faction_id" uuid,
	"owner_npc_id" uuid,
	"current_system_id" uuid,
	"status" varchar(32) DEFAULT 'active' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ships" ADD CONSTRAINT "ships_owner_faction_id_factions_id_fk" FOREIGN KEY ("owner_faction_id") REFERENCES "public"."factions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ships" ADD CONSTRAINT "ships_owner_npc_id_campaign_npcs_id_fk" FOREIGN KEY ("owner_npc_id") REFERENCES "public"."campaign_npcs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ships" ADD CONSTRAINT "ships_current_system_id_systems_id_fk" FOREIGN KEY ("current_system_id") REFERENCES "public"."systems"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ships" ADD CONSTRAINT "ships_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ships_current_system_idx" ON "ships" USING btree ("current_system_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ship_traits" (
	"ship_id" uuid NOT NULL,
	"trait_id" uuid NOT NULL,
	CONSTRAINT "ship_traits_ship_id_trait_id_pk" PRIMARY KEY("ship_id","trait_id")
);
--> statement-breakpoint
ALTER TABLE "ship_traits" ADD CONSTRAINT "ship_traits_ship_id_ships_id_fk" FOREIGN KEY ("ship_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ship_traits" ADD CONSTRAINT "ship_traits_trait_id_traits_id_fk" FOREIGN KEY ("trait_id") REFERENCES "public"."traits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "patrons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"npc_id" uuid NOT NULL,
	"reputation" integer DEFAULT 0 NOT NULL,
	"payment_record" varchar(32) DEFAULT 'variable' NOT NULL,
	"job_types" text[] DEFAULT '{}'::text[] NOT NULL,
	"risk_tolerance" varchar(32) DEFAULT 'moderate' NOT NULL,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "patrons" ADD CONSTRAINT "patrons_npc_id_campaign_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."campaign_npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "patrons" ADD CONSTRAINT "patrons_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "patrons_npc_idx" ON "patrons" USING btree ("npc_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"name" varchar(150) NOT NULL,
	"type" varchar(32) DEFAULT 'other' NOT NULL,
	"description" text,
	"security_level" integer,
	"notes" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_system_name_key" UNIQUE("system_id","name")
);
--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "locations" ADD CONSTRAINT "locations_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "location_traits" (
	"location_id" uuid NOT NULL,
	"trait_id" uuid NOT NULL,
	CONSTRAINT "location_traits_location_id_trait_id_pk" PRIMARY KEY("location_id","trait_id")
);
--> statement-breakpoint
ALTER TABLE "location_traits" ADD CONSTRAINT "location_traits_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_traits" ADD CONSTRAINT "location_traits_trait_id_traits_id_fk" FOREIGN KEY ("trait_id") REFERENCES "public"."traits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_factions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"faction_id" uuid NOT NULL,
	"presence_type" varchar(32) NOT NULL,
	"influence" integer DEFAULT 3 NOT NULL,
	"relationship_to_party" varchar(32) DEFAULT 'neutral' NOT NULL,
	"notes" text,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_factions_system_faction_key" UNIQUE("system_id","faction_id")
);
--> statement-breakpoint
ALTER TABLE "system_factions" ADD CONSTRAINT "system_factions_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_factions" ADD CONSTRAINT "system_factions_faction_id_factions_id_fk" FOREIGN KEY ("faction_id") REFERENCES "public"."factions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_factions" ADD CONSTRAINT "system_factions_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_factions_system_idx" ON "system_factions" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_factions_faction_idx" ON "system_factions" USING btree ("faction_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_npcs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"npc_id" uuid NOT NULL,
	"connection_type" varchar(32) NOT NULL,
	"current_status" varchar(100),
	"arrival_date" date,
	"departure_date" date,
	"notes" text,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_npcs" ADD CONSTRAINT "system_npcs_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_npcs" ADD CONSTRAINT "system_npcs_npc_id_campaign_npcs_id_fk" FOREIGN KEY ("npc_id") REFERENCES "public"."campaign_npcs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_npcs" ADD CONSTRAINT "system_npcs_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_npcs_system_idx" ON "system_npcs" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_npcs_npc_idx" ON "system_npcs" USING btree ("npc_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_ships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"ship_id" uuid NOT NULL,
	"docked_at_location_id" uuid,
	"arrival_date" date,
	"departure_date" date,
	"purpose" varchar(32),
	"status" varchar(32) DEFAULT 'docked' NOT NULL,
	"notes" text,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_ships" ADD CONSTRAINT "system_ships_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_ships" ADD CONSTRAINT "system_ships_ship_id_ships_id_fk" FOREIGN KEY ("ship_id") REFERENCES "public"."ships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_ships" ADD CONSTRAINT "system_ships_docked_at_location_id_locations_id_fk" FOREIGN KEY ("docked_at_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_ships" ADD CONSTRAINT "system_ships_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_ships_system_idx" ON "system_ships" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_ships_ship_idx" ON "system_ships" USING btree ("ship_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_patrons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"system_id" uuid NOT NULL,
	"patron_id" uuid NOT NULL,
	"availability" varchar(32) DEFAULT 'available' NOT NULL,
	"job_summary" text,
	"reward" varchar(200),
	"difficulty" varchar(32),
	"legal_status" varchar(32),
	"notes" text,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "system_patrons" ADD CONSTRAINT "system_patrons_system_id_systems_id_fk" FOREIGN KEY ("system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_patrons" ADD CONSTRAINT "system_patrons_patron_id_patrons_id_fk" FOREIGN KEY ("patron_id") REFERENCES "public"."patrons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_patrons" ADD CONSTRAINT "system_patrons_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_patrons_system_idx" ON "system_patrons" USING btree ("system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_patrons_patron_idx" ON "system_patrons" USING btree ("patron_id");--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "system_systems" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_system_id" uuid NOT NULL,
	"to_system_id" uuid NOT NULL,
	"relationship_type" varchar(32) NOT NULL,
	"strength" integer DEFAULT 2 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"notes" text,
	"visibility" varchar(16) DEFAULT 'public' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "system_systems_pair_type_key" UNIQUE("from_system_id","to_system_id","relationship_type"),
	CONSTRAINT "system_systems_no_self_link" CHECK ("from_system_id" <> "to_system_id")
);
--> statement-breakpoint
ALTER TABLE "system_systems" ADD CONSTRAINT "system_systems_from_system_id_systems_id_fk" FOREIGN KEY ("from_system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_systems" ADD CONSTRAINT "system_systems_to_system_id_systems_id_fk" FOREIGN KEY ("to_system_id") REFERENCES "public"."systems"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "system_systems" ADD CONSTRAINT "system_systems_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_systems_from_idx" ON "system_systems" USING btree ("from_system_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "system_systems_to_idx" ON "system_systems" USING btree ("to_system_id");
