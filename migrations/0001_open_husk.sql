ALTER TABLE "collections" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "content" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "universes" ALTER COLUMN "description" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "preferredLanguage" varchar(10);