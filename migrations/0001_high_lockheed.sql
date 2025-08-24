CREATE TABLE "content" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"universeId" text NOT NULL,
	"userId" text NOT NULL,
	"isViewable" boolean DEFAULT false NOT NULL,
	"mediaType" varchar(50) NOT NULL,
	"sourceLink" varchar(500),
	"sourceLinkName" varchar(255),
	"lastAccessedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contentRelationships" (
	"id" text PRIMARY KEY NOT NULL,
	"parentId" text NOT NULL,
	"childId" text NOT NULL,
	"universeId" text NOT NULL,
	"userId" text NOT NULL,
	"displayOrder" integer,
	"contextDescription" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "favorites" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"targetId" text NOT NULL,
	"targetType" varchar(20) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"userId" text NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"sourceLink" varchar(500),
	"sourceLinkName" varchar(255),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "userProgress" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"contentId" text NOT NULL,
	"universeId" text NOT NULL,
	"progress" integer DEFAULT 0 NOT NULL,
	"lastAccessedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_universeId_universes_id_fk" FOREIGN KEY ("universeId") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRelationships" ADD CONSTRAINT "contentRelationships_parentId_content_id_fk" FOREIGN KEY ("parentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRelationships" ADD CONSTRAINT "contentRelationships_childId_content_id_fk" FOREIGN KEY ("childId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRelationships" ADD CONSTRAINT "contentRelationships_universeId_universes_id_fk" FOREIGN KEY ("universeId") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contentRelationships" ADD CONSTRAINT "contentRelationships_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universes" ADD CONSTRAINT "universes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userProgress" ADD CONSTRAINT "userProgress_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userProgress" ADD CONSTRAINT "userProgress_contentId_content_id_fk" FOREIGN KEY ("contentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "userProgress" ADD CONSTRAINT "userProgress_universeId_universes_id_fk" FOREIGN KEY ("universeId") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_universeId_idx" ON "content" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "content_userId_idx" ON "content" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "content_isViewable_idx" ON "content" USING btree ("isViewable");--> statement-breakpoint
CREATE INDEX "content_mediaType_idx" ON "content" USING btree ("mediaType");--> statement-breakpoint
CREATE INDEX "content_createdAt_idx" ON "content" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "contentRelationships_parentId_idx" ON "contentRelationships" USING btree ("parentId");--> statement-breakpoint
CREATE INDEX "contentRelationships_childId_idx" ON "contentRelationships" USING btree ("childId");--> statement-breakpoint
CREATE INDEX "contentRelationships_universeId_idx" ON "contentRelationships" USING btree ("universeId");--> statement-breakpoint
CREATE UNIQUE INDEX "contentRelationships_parent_child_unique" ON "contentRelationships" USING btree ("parentId","childId");--> statement-breakpoint
CREATE INDEX "favorites_userId_idx" ON "favorites" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "favorites_targetId_idx" ON "favorites" USING btree ("targetId");--> statement-breakpoint
CREATE INDEX "favorites_targetType_idx" ON "favorites" USING btree ("targetType");--> statement-breakpoint
CREATE UNIQUE INDEX "favorites_user_target_unique" ON "favorites" USING btree ("userId","targetId","targetType");--> statement-breakpoint
CREATE INDEX "universes_userId_idx" ON "universes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "universes_isPublic_idx" ON "universes" USING btree ("isPublic");--> statement-breakpoint
CREATE INDEX "universes_createdAt_idx" ON "universes" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "userProgress_userId_idx" ON "userProgress" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "userProgress_contentId_idx" ON "userProgress" USING btree ("contentId");--> statement-breakpoint
CREATE INDEX "userProgress_universeId_idx" ON "userProgress" USING btree ("universeId");--> statement-breakpoint
CREATE UNIQUE INDEX "userProgress_user_content_unique" ON "userProgress" USING btree ("userId","contentId");