// Service exports for the four-tier CanonCore architecture
export { UniverseService } from './universe.service'
export { CollectionService } from './collection.service'
export { GroupService } from './group.service'
export { ContentService } from './content.service'
export { RelationshipService } from './relationship.service'

// Re-export types for convenience
export type {
  Universe,
  NewUniverse,
  Collection,
  NewCollection,
  Group,
  NewGroup,
  Content,
  NewContent,
  GroupRelationship,
  NewGroupRelationship,
  ContentRelationship,
  NewContentRelationship,
} from '@/lib/db/schema'
