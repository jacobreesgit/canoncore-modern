ALTER TABLE "content" DROP COLUMN "lastAccessedAt";--> statement-breakpoint
ALTER TABLE "contentRelationships" DROP COLUMN "contextDescription";--> statement-breakpoint
ALTER TABLE "userProgress" DROP COLUMN "lastAccessedAt";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "emailVerified";