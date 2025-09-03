/**
 * Service Layer Exports
 *
 * Centralized exports for all CanonCore data access services.
 * These services provide server-side data access using Drizzle ORM
 * with PostgreSQL for enhanced security and performance.
 */

export { userService } from './user.service'
export { universeService } from './universe.service'
export { contentService } from './content.service'
export { relationshipService } from './relationship.service'
export { progressService } from './progress.service'
export { sourceService } from './source.service'

// Type exports
export type { User, NewUser } from '@/lib/db/schema'
export type { Universe, NewUniverse } from '@/lib/db/schema'
export type { Content, NewContent } from '@/lib/db/schema'
export type {
  ContentRelationship,
  NewContentRelationship,
} from '@/lib/db/schema'
export type { UserProgress, NewUserProgress } from '@/lib/db/schema'
export type { Favorite, NewFavorite } from '@/lib/db/schema'
export type { Source, NewSource } from '@/lib/db/schema'
