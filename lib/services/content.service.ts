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

export class ContentService {
  /**
   * Create a new content item
   */
  static async create(
    data: Omit<NewContent, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<Content> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error creating content:', error)
      throw new Error('Failed to create content')
    }
  }

  /**
   * Get content by group with ownership check
   */
  static async getByGroup(groupId: string, userId: string): Promise<Content[]> {
    try {
      return await db
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
    } catch (error) {
      console.error('Error fetching content:', error)
      throw new Error('Failed to fetch content')
    }
  }

  /**
   * Get viewable content by universe (for flat views)
   */
  static async getViewableByUniverse(
    universeId: string,
    userId: string
  ): Promise<Content[]> {
    try {
      return await db
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
    } catch (error) {
      console.error('Error fetching viewable content:', error)
      throw new Error('Failed to fetch viewable content')
    }
  }

  /**
   * Get a specific content item by ID with ownership check
   */
  static async getById(id: string, userId: string): Promise<Content | null> {
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

      return contentItem || null
    } catch (error) {
      console.error('Error fetching content:', error)
      throw new Error('Failed to fetch content')
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
  ): Promise<Content> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error updating content:', error)
      throw new Error('Failed to update content')
    }
  }

  /**
   * Delete a content item with ownership check
   */
  static async delete(id: string, userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Error deleting content:', error)
      throw new Error('Failed to delete content')
    }
  }

  /**
   * Update content order within a group
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    groupId: string,
    userId: string
  ): Promise<void> {
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
    } catch (error) {
      console.error('Error updating content order:', error)
      throw new Error('Failed to update content order')
    }
  }

  /**
   * Toggle content viewability
   */
  static async toggleViewable(id: string, userId: string): Promise<Content> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error toggling content viewability:', error)
      throw new Error('Failed to toggle content viewability')
    }
  }

  /**
   * Check if user has access to content
   */
  static async checkAccess(id: string, userId: string): Promise<boolean> {
    try {
      const [contentItem] = await db
        .select({ id: content.id })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(content.id, id), eq(universes.userId, userId)))
        .limit(1)

      return !!contentItem
    } catch (error) {
      console.error('Error checking content access:', error)
      return false
    }
  }
}
