import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  collections,
  universes,
  groups,
  content,
  groupRelationships,
  contentRelationships,
  type Collection,
  type NewCollection,
} from '@/lib/db/schema'
import type {
  GroupItem,
  ContentItem,
  GroupRelationship as GroupRelationshipItem,
  ContentRelationship as ContentRelationshipItem,
} from '@/components/tree/tree-types'

// Consistent error types for Collection operations
export class CollectionServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'VALIDATION_ERROR'
      | 'COLLECTION_NOT_FOUND'
      | 'ACCESS_DENIED'
      | 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'CollectionServiceError'
  }
}

// Service result type for consistent responses
export type CollectionServiceResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      code: CollectionServiceError['code']
    }

export class CollectionService {
  /**
   * Create a new collection
   */
  static async create(
    data: Omit<NewCollection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<CollectionServiceResult<Collection>> {
    try {
      const collection = await db.transaction(async tx => {
        // Verify user owns the universe
        const [universe] = await tx
          .select({ id: universes.id })
          .from(universes)
          .where(
            and(eq(universes.id, data.universeId), eq(universes.userId, userId))
          )
          .limit(1)

        if (!universe) {
          throw new Error('Universe not found or access denied')
        }

        const [collection] = await tx
          .insert(collections)
          .values({
            ...data,
            userId,
          })
          .returning()

        return collection
      })

      return {
        success: true,
        data: collection,
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Universe not found or access denied',
          code: 'ACCESS_DENIED',
        }
      }
      return {
        success: false,
        error: 'Failed to create collection',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get collections by universe with ownership check
   */
  static async getByUniverse(
    universeId: string,
    userId: string
  ): Promise<CollectionServiceResult<Collection[]>> {
    try {
      const collectionsData = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          universeId: collections.universeId,
          userId: collections.userId,
          order: collections.order,
          createdAt: collections.createdAt,
          updatedAt: collections.updatedAt,
        })
        .from(collections)
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(collections.universeId, universeId),
            eq(universes.userId, userId)
          )
        )
        .orderBy(asc(collections.order), desc(collections.createdAt))

      return {
        success: true,
        data: collectionsData,
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
      return {
        success: false,
        error: 'Failed to fetch collections',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get a specific collection by ID with ownership check
   */
  static async getById(
    id: string,
    userId: string
  ): Promise<CollectionServiceResult<Collection | null>> {
    try {
      const [collection] = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          universeId: collections.universeId,
          userId: collections.userId,
          order: collections.order,
          createdAt: collections.createdAt,
          updatedAt: collections.updatedAt,
        })
        .from(collections)
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(collections.id, id), eq(universes.userId, userId)))
        .limit(1)

      if (!collection) {
        return {
          success: false,
          error: 'Collection not found or access denied',
          code: 'COLLECTION_NOT_FOUND',
        }
      }

      return {
        success: true,
        data: collection,
      }
    } catch (error) {
      console.error('Error fetching collection:', error)
      return {
        success: false,
        error: 'Failed to fetch collection',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update a collection with ownership check
   */
  static async update(
    id: string,
    data: Partial<
      Omit<NewCollection, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
    userId: string
  ): Promise<CollectionServiceResult<Collection>> {
    try {
      const collection = await db.transaction(async tx => {
        // Verify ownership through universe
        const [existingCollection] = await tx
          .select({ universeId: collections.universeId })
          .from(collections)
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(collections.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingCollection) {
          throw new Error('Collection not found or access denied')
        }

        const [collection] = await tx
          .update(collections)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(collections.id, id))
          .returning()

        return collection
      })

      return {
        success: true,
        data: collection,
      }
    } catch (error) {
      console.error('Error updating collection:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Collection not found or access denied',
          code: 'COLLECTION_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to update collection',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Delete a collection with ownership check
   */
  static async delete(
    id: string,
    userId: string
  ): Promise<CollectionServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Verify ownership through universe
        const [existingCollection] = await tx
          .select({ universeId: collections.universeId })
          .from(collections)
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(collections.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingCollection) {
          throw new Error('Collection not found or access denied')
        }

        // Delete collection (cascade will handle related records)
        await tx.delete(collections).where(eq(collections.id, id))
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error deleting collection:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Collection not found or access denied',
          code: 'COLLECTION_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to delete collection',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update collection order within a universe
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    universeId: string,
    userId: string
  ): Promise<CollectionServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Verify user owns the universe
        const [universe] = await tx
          .select({ id: universes.id })
          .from(universes)
          .where(
            and(eq(universes.id, universeId), eq(universes.userId, userId))
          )
          .limit(1)

        if (!universe) {
          throw new Error('Universe not found or access denied')
        }

        // Update collection orders
        for (const update of orderUpdates) {
          await tx
            .update(collections)
            .set({
              order: update.order,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(collections.id, update.id),
                eq(collections.universeId, universeId)
              )
            )
        }
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error updating collection order:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Universe not found or access denied',
          code: 'ACCESS_DENIED',
        }
      }
      return {
        success: false,
        error: 'Failed to update collection order',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Check if user has access to collection
   */
  static async checkAccess(
    id: string,
    userId: string
  ): Promise<CollectionServiceResult<boolean>> {
    try {
      const [collection] = await db
        .select({ id: collections.id })
        .from(collections)
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(collections.id, id), eq(universes.userId, userId)))
        .limit(1)

      return {
        success: true,
        data: !!collection,
      }
    } catch (error) {
      console.error('Error checking collection access:', error)
      return {
        success: false,
        error: 'Failed to check collection access',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get complete hierarchy for a collection (Collection → Groups → Content)
   */
  static async getCompleteHierarchy(
    collectionId: string,
    userId: string
  ): Promise<
    CollectionServiceResult<{
      collection: Collection
      groups: GroupItem[]
      content: ContentItem[]
      groupRelationships: GroupRelationshipItem[]
      contentRelationships: ContentRelationshipItem[]
    }>
  > {
    try {
      // First verify user has access to the collection
      const collectionResult = await this.getById(collectionId, userId)
      if (!collectionResult.success) {
        return collectionResult
      }

      // Fetch all groups for this collection
      const groupsData = await db
        .select()
        .from(groups)
        .where(eq(groups.collectionId, collectionId))
        .orderBy(asc(groups.order), desc(groups.createdAt))

      // Fetch all content for these groups
      const contentData = await db
        .select({
          content: content,
          groupId: groups.id,
          collectionId: groups.collectionId,
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .where(eq(groups.collectionId, collectionId))
        .orderBy(asc(content.order), desc(content.createdAt))

      // Fetch group relationships for hierarchy
      const groupRelationshipsData = await db
        .select({
          id: groupRelationships.id,
          parentGroupId: groupRelationships.parentGroupId,
          childGroupId: groupRelationships.childGroupId,
        })
        .from(groupRelationships)
        .innerJoin(groups, eq(groupRelationships.parentGroupId, groups.id))
        .where(eq(groups.collectionId, collectionId))

      // Fetch content relationships for hierarchy
      const contentRelationshipsData = await db
        .select({
          id: contentRelationships.id,
          parentContentId: contentRelationships.parentContentId,
          childContentId: contentRelationships.childContentId,
        })
        .from(contentRelationships)
        .innerJoin(
          content,
          eq(contentRelationships.parentContentId, content.id)
        )
        .innerJoin(groups, eq(content.groupId, groups.id))
        .where(eq(groups.collectionId, collectionId))

      return {
        success: true,
        data: {
          collection: collectionResult.data!,
          groups: groupsData as GroupItem[],
          content: contentData.map(item => ({
            ...item.content,
            groupId: item.groupId,
            collectionId: item.collectionId,
            releaseDate: item.content.releaseDate
              ? new Date(item.content.releaseDate)
              : null,
          })) as ContentItem[],
          groupRelationships: groupRelationshipsData as GroupRelationshipItem[],
          contentRelationships:
            contentRelationshipsData as ContentRelationshipItem[],
        },
      }
    } catch (error) {
      console.error('Error fetching complete collection hierarchy:', error)
      return {
        success: false,
        error: 'Failed to fetch complete hierarchy',
        code: 'DATABASE_ERROR',
      }
    }
  }
}
