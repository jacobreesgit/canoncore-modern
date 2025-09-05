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

export class GroupService {
  /**
   * Create a new group
   */
  static async create(
    data: Omit<NewGroup, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<Group> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error creating group:', error)
      throw new Error('Failed to create group')
    }
  }

  /**
   * Get groups by collection with ownership check
   */
  static async getByCollection(
    collectionId: string,
    userId: string
  ): Promise<Group[]> {
    try {
      return await db
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
    } catch (error) {
      console.error('Error fetching groups:', error)
      throw new Error('Failed to fetch groups')
    }
  }

  /**
   * Get a specific group by ID with ownership check
   */
  static async getById(id: string, userId: string): Promise<Group | null> {
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

      return group || null
    } catch (error) {
      console.error('Error fetching group:', error)
      throw new Error('Failed to fetch group')
    }
  }

  /**
   * Update a group with ownership check
   */
  static async update(
    id: string,
    data: Partial<Omit<NewGroup, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
    userId: string
  ): Promise<Group> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error updating group:', error)
      throw new Error('Failed to update group')
    }
  }

  /**
   * Delete a group with ownership check
   */
  static async delete(id: string, userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Error deleting group:', error)
      throw new Error('Failed to delete group')
    }
  }

  /**
   * Update group order within a collection
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    collectionId: string,
    userId: string
  ): Promise<void> {
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
    } catch (error) {
      console.error('Error updating group order:', error)
      throw new Error('Failed to update group order')
    }
  }

  /**
   * Check if user has access to group
   */
  static async checkAccess(id: string, userId: string): Promise<boolean> {
    try {
      const [group] = await db
        .select({ id: groups.id })
        .from(groups)
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(groups.id, id), eq(universes.userId, userId)))
        .limit(1)

      return !!group
    } catch (error) {
      console.error('Error checking group access:', error)
      return false
    }
  }

  /**
   * Get complete hierarchy for a group (Group → Content → Sub-content)
   */
  static async getCompleteHierarchy(groupId: string, userId: string) {
    try {
      // First verify user has access to the group
      const group = await this.getById(groupId, userId)
      if (!group) {
        throw new Error('Group not found or access denied')
      }

      // Fetch all content for this group
      const contentData = await db
        .select()
        .from(content)
        .where(eq(content.groupId, groupId))
        .orderBy(asc(content.order), desc(content.createdAt))

      // Fetch content relationships for hierarchy
      const contentRelationshipsData = await db
        .select()
        .from(contentRelationships)
        .innerJoin(
          content,
          eq(contentRelationships.parentContentId, content.id)
        )
        .where(eq(content.groupId, groupId))

      return {
        group,
        content: contentData,
        contentRelationships: contentRelationshipsData,
      }
    } catch (error) {
      console.error('Error fetching complete group hierarchy:', error)
      throw new Error('Failed to fetch complete hierarchy')
    }
  }
}
