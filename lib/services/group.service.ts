import { eq, and, desc, asc } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  groups,
  collections,
  universes,
  content,
  contentRelationships,
  type Group,
  type NewGroup,
} from '@/lib/db/schema'
import type {
  ContentItem,
  ContentRelationship as ContentRelationshipItem,
} from '@/components/tree/tree-types'

// Consistent error types for Group operations
export class GroupServiceError extends Error {
  constructor(
    message: string,
    public code:
      | 'VALIDATION_ERROR'
      | 'GROUP_NOT_FOUND'
      | 'ACCESS_DENIED'
      | 'DATABASE_ERROR'
  ) {
    super(message)
    this.name = 'GroupServiceError'
  }
}

// Service result type for consistent responses
export type GroupServiceResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: string
      code: GroupServiceError['code']
    }

export class GroupService {
  /**
   * Create a new group
   */
  static async create(
    data: Omit<NewGroup, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<GroupServiceResult<Group>> {
    try {
      const group = await db.transaction(async tx => {
        // Verify user owns the collection through universe ownership
        const [collection] = await tx
          .select({ id: collections.id })
          .from(collections)
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(
              eq(collections.id, data.collectionId),
              eq(universes.userId, userId)
            )
          )
          .limit(1)

        if (!collection) {
          throw new Error('Collection not found or access denied')
        }

        const [group] = await tx
          .insert(groups)
          .values({
            ...data,
            userId,
          })
          .returning()

        return group
      })

      return {
        success: true,
        data: group,
      }
    } catch (error) {
      console.error('Error creating group:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Collection not found or access denied',
          code: 'ACCESS_DENIED',
        }
      }
      return {
        success: false,
        error: 'Failed to create group',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get groups by collection with ownership check
   */
  static async getByCollection(
    collectionId: string,
    userId: string
  ): Promise<GroupServiceResult<Group[]>> {
    try {
      const groupsData = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          collectionId: groups.collectionId,
          userId: groups.userId,
          itemType: groups.itemType,
          order: groups.order,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        })
        .from(groups)
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(groups.collectionId, collectionId),
            eq(universes.userId, userId)
          )
        )
        .orderBy(asc(groups.order), desc(groups.createdAt))

      return {
        success: true,
        data: groupsData,
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
      return {
        success: false,
        error: 'Failed to fetch groups',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get a specific group by ID with ownership check
   */
  static async getById(
    id: string,
    userId: string
  ): Promise<GroupServiceResult<Group | null>> {
    try {
      const [group] = await db
        .select({
          id: groups.id,
          name: groups.name,
          description: groups.description,
          collectionId: groups.collectionId,
          userId: groups.userId,
          itemType: groups.itemType,
          order: groups.order,
          createdAt: groups.createdAt,
          updatedAt: groups.updatedAt,
        })
        .from(groups)
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(groups.id, id), eq(universes.userId, userId)))
        .limit(1)

      if (!group) {
        return {
          success: false,
          error: 'Group not found or access denied',
          code: 'GROUP_NOT_FOUND',
        }
      }

      return {
        success: true,
        data: group,
      }
    } catch (error) {
      console.error('Error fetching group:', error)
      return {
        success: false,
        error: 'Failed to fetch group',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update a group with ownership check
   */
  static async update(
    id: string,
    data: Partial<Omit<NewGroup, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<GroupServiceResult<Group>> {
    try {
      const group = await db.transaction(async tx => {
        // Verify ownership through collection and universe
        const [existingGroup] = await tx
          .select({ collectionId: groups.collectionId })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(groups.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingGroup) {
          throw new Error('Group not found or access denied')
        }

        const [group] = await tx
          .update(groups)
          .set({
            ...data,
            updatedAt: new Date(),
          })
          .where(eq(groups.id, id))
          .returning()

        return group
      })

      return {
        success: true,
        data: group,
      }
    } catch (error) {
      console.error('Error updating group:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Group not found or access denied',
          code: 'GROUP_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to update group',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Delete a group with ownership check
   */
  static async delete(
    id: string,
    userId: string
  ): Promise<GroupServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Verify ownership through collection and universe
        const [existingGroup] = await tx
          .select({ collectionId: groups.collectionId })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(groups.id, id), eq(universes.userId, userId)))
          .limit(1)

        if (!existingGroup) {
          throw new Error('Group not found or access denied')
        }

        // Delete group (cascade will handle related records)
        await tx.delete(groups).where(eq(groups.id, id))
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Group not found or access denied',
          code: 'GROUP_NOT_FOUND',
        }
      }
      return {
        success: false,
        error: 'Failed to delete group',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Update group order within a collection
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    collectionId: string,
    userId: string
  ): Promise<GroupServiceResult<void>> {
    try {
      await db.transaction(async tx => {
        // Verify user owns the collection through universe
        const [collection] = await tx
          .select({ id: collections.id })
          .from(collections)
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(eq(collections.id, collectionId), eq(universes.userId, userId))
          )
          .limit(1)

        if (!collection) {
          throw new Error('Collection not found or access denied')
        }

        // Update group orders
        for (const update of orderUpdates) {
          await tx
            .update(groups)
            .set({
              order: update.order,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(groups.id, update.id),
                eq(groups.collectionId, collectionId)
              )
            )
        }
      })

      return {
        success: true,
        data: undefined,
      }
    } catch (error) {
      console.error('Error updating group order:', error)
      if (error instanceof Error && error.message.includes('not found')) {
        return {
          success: false,
          error: 'Collection not found or access denied',
          code: 'ACCESS_DENIED',
        }
      }
      return {
        success: false,
        error: 'Failed to update group order',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Check if user has access to group
   */
  static async checkAccess(
    id: string,
    userId: string
  ): Promise<GroupServiceResult<boolean>> {
    try {
      const [group] = await db
        .select({ id: groups.id })
        .from(groups)
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(groups.id, id), eq(universes.userId, userId)))
        .limit(1)

      return {
        success: true,
        data: !!group,
      }
    } catch (error) {
      console.error('Error checking group access:', error)
      return {
        success: false,
        error: 'Failed to check group access',
        code: 'DATABASE_ERROR',
      }
    }
  }

  /**
   * Get complete hierarchy for a group (Group → Content → Sub-content)
   */
  static async getCompleteHierarchy(
    groupId: string,
    userId: string
  ): Promise<
    GroupServiceResult<{
      group: Group
      content: ContentItem[]
      contentRelationships: ContentRelationshipItem[]
    }>
  > {
    try {
      // First verify user has access to the group
      const groupResult = await this.getById(groupId, userId)
      if (!groupResult.success) {
        return groupResult
      }

      // Fetch all content for this group with collectionId
      const contentData = await db
        .select({
          content: content,
          collectionId: groups.collectionId,
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .where(eq(content.groupId, groupId))
        .orderBy(asc(content.order), desc(content.createdAt))

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
        .where(eq(content.groupId, groupId))

      return {
        success: true,
        data: {
          group: groupResult.data!,
          content: contentData.map(item => ({
            ...item.content,
            collectionId: item.collectionId,
            releaseDate: item.content.releaseDate
              ? new Date(item.content.releaseDate)
              : null,
          })) as ContentItem[],
          contentRelationships:
            contentRelationshipsData as ContentRelationshipItem[],
        },
      }
    } catch (error) {
      console.error('Error fetching complete group hierarchy:', error)
      return {
        success: false,
        error: 'Failed to fetch complete hierarchy',
        code: 'DATABASE_ERROR',
      }
    }
  }
}
