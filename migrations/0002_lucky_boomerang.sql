ALTER TABLE "sources" ADD COLUMN "backgroundColor" varchar(7) NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" ADD COLUMN "textColor" varchar(7) NOT NULL;--> statement-breakpoint
ALTER TABLE "sources" DROP COLUMN "color";