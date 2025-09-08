import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  content,
  groups,
  collections,
  universes,
  type Content,
  type NewContent,
} from '@/lib/db/schema'

// Consistent error types for Content operations
export class ContentServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'VALIDATION_ERROR'
      | 'CONTENT_NOT_FOUND'
      | 'ACCESS_DENIED'
      | 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'ContentServiceError'
  }
}

// Service result type for consistent responses
export type ContentServiceResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      code: ContentServiceError['code']
    }

export class ContentService {
  /**
   * Create a new content item
   */
  static async create(
    data: Omit<NewContent, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<ContentServiceResult<Content>> {
    try {
      const contentItem = await db.transaction(async tx => {
        // Verify user owns the group through collection and universe ownership
        const [group] = await tx
          .select({ id: groups.id })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(groups.id, data.groupId), eq(universes.userId, userId)))
          .limit(1)

        if (!group) {
          throw new Error('Group not found or access denied')
        }

        const [contentItem] = await tx
          .insert(content)
          .values({
            ...data,
            userId,
          })
          .returning()

        return contentItem
      })

      return {
        success: true,
        data: contentItem,
      }
    } catch (error) {
      console.error('Error creating content:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Group not found or access denied',
          code: 'ACCESS_DENIED',
        }
      }
      return {
        success: false,
        error: 'Failed to create content',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get content by group with ownership check
   */
  static async getByGroup(
    groupId: string,
    userId: string
  ): Promise<ContentServiceResult<Content[]>> {
    try {
      const contentData = await db
        .select({
          id: content.id,
          name: content.name,
          description: content.description,
          groupId: content.groupId,
          userId: content.userId,
          isViewable: content.isViewable,
          itemType: content.itemType,
          releaseDate: content.releaseDate,
          order: content.order,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(content.groupId, groupId), eq(universes.userId, userId)))
        .orderBy(asc(content.order), desc(content.createdAt))

      return {
        success: true,
        data: contentData,
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      return {
        success: false,
        error: 'Failed to fetch content',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get viewable content by universe (for flat views)
   */
  static async getViewableByUniverse(
    universeId: string,
    userId: string
  ): Promise<ContentServiceResult<Content[]>> {
    try {
      const contentData = await db
        .select({
          id: content.id,
          name: content.name,
          description: content.description,
          groupId: content.groupId,
          userId: content.userId,
          isViewable: content.isViewable,
          itemType: content.itemType,
          releaseDate: content.releaseDate,
          order: content.order,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(universes.id, universeId),
            eq(universes.userId, userId),
            eq(content.isViewable, true)
          )
        )
        .orderBy(asc(content.releaseDate), desc(content.createdAt))

      return {
        success: true,
        data: contentData,
      }
    } catch (error) {
      console.error('Error fetching viewable content:', error)
      return {
        success: false,
        error: 'Failed to fetch viewable content',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get a specific content item by ID with ownership check
   */
  static async getById(
    id: string,
    userId: string
  ): Promise<ContentServiceResult<Content | null>> {
    try {
      const [contentItem] = await db
        .select({
          id: content.id,
          name: content.name,
          description: content.description,
          groupId: content.groupId,
          userId: content.userId,
          isViewable: content.isViewable,
          itemType: content.itemType,
          releaseDate: content.releaseDate,
          order: content.order,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(content.id, id), eq(universes.userId, userId)))
        .limit(1)

      if (!contentItem) {
        return {
          success: false,
          error: 'Content not found or access denied',
          code: 'CONTENT_NOT_FOUND',
        }
      }

      return {
        success: true,
        data: contentItem,
      }
    } catch (error) {
      console.error('Error fetching content:', error)
      return {
        success: false,
        error: 'Failed to fetch content',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update a content item with ownership check
   */
  static async update(
    id: string,
    data: Partial<
      Omit<NewContent, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
    >,
    userId: string
  ): Promise<ContentServiceResult<Content>> {
    try {
      const contentItem = await db.transaction(async tx => {
        // Verify ownership through group, collection, and universe
        const [existingContent] = await tx
          .select({ groupId: content.groupId })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(content.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingContent) {
          throw new Error('Content not found or access denied')
        }

        const [contentItem] = await tx
          .update(content)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(content.id, id))
          .returning()

        return contentItem
      })

      return {
        success: true,
        data: contentItem,
      }
    } catch (error) {
      console.error('Error updating content:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Content not found or access denied',
          code: 'CONTENT_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to update content',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Delete a content item with ownership check
   */
  static async delete(
    id: string,
    userId: string
  ): Promise<ContentServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Verify ownership through group, collection, and universe
        const [existingContent] = await tx
          .select({ groupId: content.groupId })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(content.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingContent) {
          throw new Error('Content not found or access denied')
        }

        // Delete content (cascade will handle related records)
        await tx.delete(content).where(eq(content.id, id))
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error deleting content:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Content not found or access denied',
          code: 'CONTENT_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to delete content',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update content order within a group
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    groupId: string,
    userId: string
  ): Promise<ContentServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Verify user owns the group through collection and universe
        const [group] = await tx
          .select({ id: groups.id })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(groups.id, groupId), eq(universes.userId, userId)))
          .limit(1)

        if (!group) {
          throw new Error('Group not found or access denied')
        }

        // Update content orders
        for (const update of orderUpdates) {
          await tx
            .update(content)
            .set({
              order: update.order,
              updatedAt: new Date(),
            })
            .where(and(eq(content.id, update.id), eq(content.groupId, groupId)))
        }
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error updating content order:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Group not found or access denied',
          code: 'ACCESS_DENIED',
        }
      }
      return {
        success: false,
        error: 'Failed to update content order',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Toggle content viewability
   */
  static async toggleViewable(
    id: string,
    userId: string
  ): Promise<ContentServiceResult<Content>> {
    try {
      const contentItem = await db.transaction(async tx => {
        // Get current content item with ownership check
        const [existingContent] = await tx
          .select({
            isViewable: content.isViewable,
          })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(content.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingContent) {
          throw new Error('Content not found or access denied')
        }

        // Toggle viewability
        const [contentItem] = await tx
          .update(content)
          .set({
            isViewable: !existingContent.isViewable,
            updatedAt: new Date(),
          })
          .where(eq(content.id, id))
          .returning()

        return contentItem
      })

      return {
        success: true,
        data: contentItem,
      }
    } catch (error) {
      console.error('Error toggling content viewability:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Content not found or access denied',
          code: 'CONTENT_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to toggle content viewability',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Check if user has access to content
   */
  static async checkAccess(
    id: string,
    userId: string
  ): Promise<ContentServiceResult<boolean>> {
    try {
      const [contentItem] = await db
        .select({ id: content.id })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(content.id, id), eq(universes.userId, userId)))
        .limit(1)

      return {
        success: true,
        data: !!contentItem,
      }
    } catch (error) {
      console.error('Error checking content access:', error)
      return {
        success: false,
        error: 'Failed to check content access',
        code: 'DATABASE_ERROR',
      }
    }
  }
}
