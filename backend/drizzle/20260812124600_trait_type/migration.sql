ALTER TABLE "traits" ADD COLUMN "type" varchar(255) NOT NULL DEFAULT 'Weapon';--> statement-breakpoint
ALTER TABLE "traits" ALTER COLUMN "type" DROP DEFAULT;
