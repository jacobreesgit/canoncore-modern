import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  universes,
  collections,
  groups,
  content,
  groupRelationships,
  contentRelationships,
  type Universe,
  type NewUniverse,
  type Collection,
} from '@/lib/db/schema'
import type {
  GroupItem,
  ContentItem,
  GroupRelationship as GroupRelationshipItem,
  ContentRelationship as ContentRelationshipItem,
} from '@/components/tree/tree-types'

// Consistent error types for Universe operations
export class UniverseServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'VALIDATION_ERROR'
      | 'UNIVERSE_NOT_FOUND'
      | 'ACCESS_DENIED'
      | 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'UniverseServiceError'
  }
}

// Service result type for consistent responses
export type UniverseServiceResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      code: UniverseServiceError['code']
    }

export class UniverseService {
  /**
   * Create a new universe
   */
  static async create(
    data: Omit<NewUniverse, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<UniverseServiceResult<Universe>> {
    try {
      const [universe] = await db
        .insert(universes)
        .values({
          ...data,
          userId,
        })
        .returning()

      return {
        success: true,
        data: universe,
      }
    } catch (error) {
      console.error('Error creating universe:', error)
      return {
        success: false,
        error: 'Failed to create universe',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get all universes for a user
   */
  static async getByUser(
    userId: string
  ): Promise<UniverseServiceResult<Universe[]>> {
    try {
      const userUniverses = await db
        .select()
        .from(universes)
        .where(eq(universes.userId, userId))
        .orderBy(asc(universes.order), desc(universes.createdAt))

      return {
        success: true,
        data: userUniverses,
      }
    } catch (error) {
      console.error('Error fetching user universes:', error)
      return {
        success: false,
        error: 'Failed to fetch universes',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get a specific universe by ID with ownership check
   */
  static async getById(
    id: string,
    userId: string
  ): Promise<UniverseServiceResult<Universe | null>> {
    try {
      const [universe] = await db
        .select()
        .from(universes)
        .where(and(eq(universes.id, id), eq(universes.userId, userId)))
        .limit(1)

      if (!universe) {
        return {
          success: false,
          error: 'Universe not found or access denied',
          code: 'UNIVERSE_NOT_FOUND',
        }
      }

      return {
        success: true,
        data: universe,
      }
    } catch (error) {
      console.error('Error fetching universe:', error)
      return {
        success: false,
        error: 'Failed to fetch universe',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get public universes (for discovery)
   */
  static async getPublic(): Promise<UniverseServiceResult<Universe[]>> {
    try {
      const publicUniverses = await db
        .select()
        .from(universes)
        .where(eq(universes.isPublic, true))
        .orderBy(desc(universes.createdAt))

      return {
        success: true,
        data: publicUniverses,
      }
    } catch (error) {
      console.error('Error fetching public universes:', error)
      return {
        success: false,
        error: 'Failed to fetch public universes',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update a universe with ownership check
   */
  static async update(
    id: string,
    data: Partial<
      Omit<NewUniverse, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
    userId: string
  ): Promise<UniverseServiceResult<Universe>> {
    try {
      const [universe] = await db
        .update(universes)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(and(eq(universes.id, id), eq(universes.userId, userId)))
        .returning()

      if (!universe) {
        return {
          success: false,
          error: 'Universe not found or access denied',
          code: 'UNIVERSE_NOT_FOUND',
        }
      }

      return {
        success: true,
        data: universe,
      }
    } catch (error) {
      console.error('Error updating universe:', error)
      return {
        success: false,
        error: 'Failed to update universe',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Delete a universe with ownership check
   */
  static async delete(
    id: string,
    userId: string
  ): Promise<UniverseServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Delete universe (cascade will handle related records)
        const result = await tx
          .delete(universes)
          .where(and(eq(universes.id, id), eq(universes.userId, userId)))

        if (result.rowCount === 0) {
          throw new Error('Universe not found or access denied')
        }
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error deleting universe:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Universe not found or access denied',
          code: 'UNIVERSE_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to delete universe',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update universe order for a user
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    userId: string
  ): Promise<UniverseServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        for (const update of orderUpdates) {
          await tx
            .update(universes)
            .set({
              order: update.order,
              updatedAt: new Date(),
            })
            .where(
              and(eq(universes.id, update.id), eq(universes.userId, userId))
            )
        }
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error updating universe order:', error)
      return {
        success: false,
        error: 'Failed to update universe order',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Check if user owns universe
   */
  static async checkOwnership(
    id: string,
    userId: string
  ): Promise<UniverseServiceResult<boolean>> {
    try {
      const [universe] = await db
        .select({ id: universes.id })
        .from(universes)
        .where(and(eq(universes.id, id), eq(universes.userId, userId)))
        .limit(1)

      return {
        success: true,
        data: !!universe,
      }
    } catch (error) {
      console.error('Error checking universe ownership:', error)
      return {
        success: false,
        error: 'Failed to check universe ownership',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get complete hierarchy for a universe (Universe → Collections → Groups → Content)
   */
  static async getCompleteHierarchy(
    universeId: string,
    userId: string
  ): Promise<
    UniverseServiceResult<{
      universe: Universe
      collections: Collection[]
      groups: GroupItem[]
      content: ContentItem[]
      groupRelationships: GroupRelationshipItem[]
      contentRelationships: ContentRelationshipItem[]
    }>
  > {
    try {
      // First verify user owns the universe
      const universeResult = await this.getById(universeId, userId)
      if (!universeResult.success) {
        return universeResult
      }

      // Fetch all collections for this universe
      const collectionsData = await db
        .select()
        .from(collections)
        .where(eq(collections.universeId, universeId))
        .orderBy(asc(collections.order), desc(collections.createdAt))

      // Fetch all groups for these collections
      const groupsData = await db
        .select({
          group: groups,
          collectionId: collections.id,
        })
        .from(groups)
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .where(eq(collections.universeId, universeId))
        .orderBy(asc(groups.order), desc(groups.createdAt))

      // Fetch all content for these groups
      const contentData = await db
        .select({
          content: content,
          groupId: groups.id,
          collectionId: collections.id,
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .where(eq(collections.universeId, universeId))
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
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .where(eq(collections.universeId, universeId))

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
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .where(eq(collections.universeId, universeId))

      return {
        success: true,
        data: {
          universe: universeResult.data!,
          collections: collectionsData,
          groups: groupsData.map(item => ({
            ...item.group,
            collectionId: item.collectionId,
          })) as GroupItem[],
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
      console.error('Error fetching complete universe hierarchy:', error)
      return {
        success: false,
        error: 'Failed to fetch complete hierarchy',
        code: 'DATABASE_ERROR',
      }
    }
  }
}
