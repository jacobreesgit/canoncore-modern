CREATE TABLE "account" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_pkey" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"universeId" text NOT NULL,
	"userId" text NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"groupId" text NOT NULL,
	"userId" text NOT NULL,
	"isViewable" boolean DEFAULT true NOT NULL,
	"itemType" varchar(50) DEFAULT 'video' NOT NULL,
	"releaseDate" date,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"parentContentId" text NOT NULL,
	"childContentId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_relationships" (
	"id" text PRIMARY KEY NOT NULL,
	"parentGroupId" text NOT NULL,
	"childGroupId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"collectionId" text NOT NULL,
	"userId" text NOT NULL,
	"itemType" varchar(50) DEFAULT 'series' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "universes" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"userId" text NOT NULL,
	"isPublic" boolean DEFAULT false NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"image" text,
	"passwordHash" text,
	"createdAt" timestamp DEFAULT now(),
	"updatedAt" timestamp DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verificationToken" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationToken_pkey" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_universeId_universes_id_fk" FOREIGN KEY ("universeId") REFERENCES "public"."universes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_groupId_groups_id_fk" FOREIGN KEY ("groupId") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_relationships" ADD CONSTRAINT "content_relationships_parentContentId_content_id_fk" FOREIGN KEY ("parentContentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_relationships" ADD CONSTRAINT "content_relationships_childContentId_content_id_fk" FOREIGN KEY ("childContentId") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_relationships" ADD CONSTRAINT "group_relationships_parentGroupId_groups_id_fk" FOREIGN KEY ("parentGroupId") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_relationships" ADD CONSTRAINT "group_relationships_childGroupId_groups_id_fk" FOREIGN KEY ("childGroupId") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_collectionId_collections_id_fk" FOREIGN KEY ("collectionId") REFERENCES "public"."collections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "universes" ADD CONSTRAINT "universes_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collections_universeId_idx" ON "collections" USING btree ("universeId");--> statement-breakpoint
CREATE INDEX "collections_userId_idx" ON "collections" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "collections_order_idx" ON "collections" USING btree ("order");--> statement-breakpoint
CREATE INDEX "content_groupId_idx" ON "content" USING btree ("groupId");--> statement-breakpoint
CREATE INDEX "content_userId_idx" ON "content" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "content_order_idx" ON "content" USING btree ("order");--> statement-breakpoint
CREATE INDEX "content_isViewable_idx" ON "content" USING btree ("isViewable");--> statement-breakpoint
CREATE INDEX "content_relationships_parent_idx" ON "content_relationships" USING btree ("parentContentId");--> statement-breakpoint
CREATE INDEX "content_relationships_child_idx" ON "content_relationships" USING btree ("childContentId");--> statement-breakpoint
CREATE UNIQUE INDEX "content_relationships_unique" ON "content_relationships" USING btree ("parentContentId","childContentId");--> statement-breakpoint
CREATE INDEX "group_relationships_parent_idx" ON "group_relationships" USING btree ("parentGroupId");--> statement-breakpoint
CREATE INDEX "group_relationships_child_idx" ON "group_relationships" USING btree ("childGroupId");--> statement-breakpoint
CREATE UNIQUE INDEX "group_relationships_unique" ON "group_relationships" USING btree ("parentGroupId","childGroupId");--> statement-breakpoint
CREATE INDEX "groups_collectionId_idx" ON "groups" USING btree ("collectionId");--> statement-breakpoint
CREATE INDEX "groups_userId_idx" ON "groups" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "groups_order_idx" ON "groups" USING btree ("order");--> statement-breakpoint
CREATE INDEX "universes_userId_idx" ON "universes" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "universes_order_idx" ON "universes" USING btree ("order");