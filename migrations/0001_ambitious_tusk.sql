CREATE TABLE "sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"color" varchar(7) NOT NULL,
	"universeId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD COLUMN "sourceId" text;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_universeId_universes_id_fk" FOREIGN KEY ("universeId") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sources" ADD CONSTRAINT "sources_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sources_universeId_idx" ON "sources" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "sources_userId_idx" ON "sources" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "sources_name_universe_unique" ON "sources" USING btree ("name","universeId");--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_sourceId_sources_id_fk" FOREIGN KEY ("sourceId") REFERENCES "public"."sources"("id") ON DELETE set null ON UPDATE no action;