import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  groupRelationships,
  groups,
  collections,
  universes,
  type GroupRelationship,
  type NewGroupRelationship,
} from '@/lib/db/schema'

export class RelationshipService {
  /**
   * Create a group relationship (parent-child)
   */
  static async createGroupRelationship(
    data: Omit<NewGroupRelationship, 'id' | 'createdAt'>,
    userId: string
  ): Promise<GroupRelationship> {
    try {
      return await db.transaction(async tx => {
        // Verify user owns both groups through their collections and universes
        const [parentGroup] = await tx
          .select({ id: groups.id })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(eq(groups.id, data.parentGroupId), eq(universes.userId, userId))
          )
          .limit(1)

        const [childGroup] = await tx
          .select({ id: groups.id })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(eq(groups.id, data.childGroupId), eq(universes.userId, userId))
          )
          .limit(1)

        if (!parentGroup || !childGroup) {
          throw new Error('Groups not found or access denied')
        }

        // Prevent self-referencing relationships
        if (data.parentGroupId === data.childGroupId) {
          throw new Error('Cannot create self-referencing relationship')
        }

        const [relationship] = await tx
          .insert(groupRelationships)
          .values(data)
          .returning()

        return relationship
      })
    } catch (error) {
      console.error('Error creating group relationship:', error)
      throw new Error('Failed to create group relationship')
    }
  }

  /**
   * Get group relationships for a specific group
   */
  static async getGroupRelationships(
    groupId: string,
    userId: string
  ): Promise<{
    children: GroupRelationship[]
    parents: GroupRelationship[]
  }> {
    try {
      // Get child relationships
      const children = await db
        .select()
        .from(groupRelationships)
        .innerJoin(groups, eq(groupRelationships.parentGroupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(groupRelationships.parentGroupId, groupId),
            eq(universes.userId, userId)
          )
        )

      // Get parent relationships
      const parents = await db
        .select()
        .from(groupRelationships)
        .innerJoin(groups, eq(groupRelationships.childGroupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(groupRelationships.childGroupId, groupId),
            eq(universes.userId, userId)
          )
        )

      return {
        children: children.map(item => item.group_relationships),
        parents: parents.map(item => item.group_relationships),
      }
    } catch (error) {
      console.error('Error fetching group relationships:', error)
      throw new Error('Failed to fetch group relationships')
    }
  }

  /**
   * Delete a group relationship
   */
  static async deleteGroupRelationship(
    parentGroupId: string,
    childGroupId: string,
    userId: string
  ): Promise<void> {
    try {
      await db.transaction(async tx => {
        // Verify user owns both groups
        const [parentGroup] = await tx
          .select({ id: groups.id })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(eq(groups.id, parentGroupId), eq(universes.userId, userId))
          )
          .limit(1)

        const [childGroup] = await tx
          .select({ id: groups.id })
          .from(groups)
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(and(eq(groups.id, childGroupId), eq(universes.userId, userId)))
          .limit(1)

        if (!parentGroup || !childGroup) {
          throw new Error('Groups not found or access denied')
        }

        // Delete the relationship
        const result = await tx
          .delete(groupRelationships)
          .where(
            and(
              eq(groupRelationships.parentGroupId, parentGroupId),
              eq(groupRelationships.childGroupId, childGroupId)
            )
          )

        if (result.rowCount === 0) {
          throw new Error('Relationship not found')
        }
      })
    } catch (error) {
      console.error('Error deleting group relationship:', error)
      throw new Error('Failed to delete group relationship')
    }
  }
}
