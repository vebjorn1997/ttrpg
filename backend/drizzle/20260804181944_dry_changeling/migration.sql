CREATE TABLE "actions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "actions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL UNIQUE,
	"type" varchar(255) NOT NULL,
	"cost" integer NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "called_shots" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "called_shots_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"location" varchar(255) NOT NULL UNIQUE,
	"cost" integer NOT NULL,
	"penalty" integer NOT NULL,
	"description" text NOT NULL,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "conditions" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "conditions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL UNIQUE,
	"description" text NOT NULL,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "critical_injury" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "critical_injury_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL UNIQUE,
	"description" text NOT NULL,
	"characteristic" varchar(255) NOT NULL,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "healing" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "healing_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL UNIQUE,
	"cost" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"tags" text[]
);
--> statement-breakpoint
CREATE TABLE "weapons_traits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "weapons_traits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(255) NOT NULL UNIQUE,
	"description" text NOT NULL,
	"tags" text[]
);
