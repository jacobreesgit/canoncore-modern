import { eq, and } from 'drizzle-orm'
import { db } from '@/lib/db'
import {
  groupRelationships,
  contentRelationships,
  groups,
  content,
  collections,
  universes,
  type GroupRelationship,
  type ContentRelationship,
  type NewGroupRelationship,
  type NewContentRelationship,
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
   * Create a content relationship (parent-child)
   */
  static async createContentRelationship(
    data: Omit<NewContentRelationship, 'id' | 'createdAt'>,
    userId: string
  ): Promise<ContentRelationship> {
    try {
      return await db.transaction(async tx => {
        // Verify user owns both content items through their groups, collections, and universes
        const [parentContent] = await tx
          .select({ id: content.id })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(
              eq(content.id, data.parentContentId),
              eq(universes.userId, userId)
            )
          )
          .limit(1)

        const [childContent] = await tx
          .select({ id: content.id })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(
              eq(content.id, data.childContentId),
              eq(universes.userId, userId)
            )
          )
          .limit(1)

        if (!parentContent || !childContent) {
          throw new Error('Content items not found or access denied')
        }

        // Prevent self-referencing relationships
        if (data.parentContentId === data.childContentId) {
          throw new Error('Cannot create self-referencing relationship')
        }

        const [relationship] = await tx
          .insert(contentRelationships)
          .values(data)
          .returning()

        return relationship
      })
    } catch (error) {
      console.error('Error creating content relationship:', error)
      throw new Error('Failed to create content relationship')
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
   * Get content relationships for a specific content item
   */
  static async getContentRelationships(
    contentId: string,
    userId: string
  ): Promise<{
    children: ContentRelationship[]
    parents: ContentRelationship[]
  }> {
    try {
      // Get child relationships
      const children = await db
        .select()
        .from(contentRelationships)
        .innerJoin(
          content,
          eq(contentRelationships.parentContentId, content.id)
        )
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(contentRelationships.parentContentId, contentId),
            eq(universes.userId, userId)
          )
        )

      // Get parent relationships
      const parents = await db
        .select()
        .from(contentRelationships)
        .innerJoin(content, eq(contentRelationships.childContentId, content.id))
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(
          and(
            eq(contentRelationships.childContentId, contentId),
            eq(universes.userId, userId)
          )
        )

      return {
        children: children.map(item => item.content_relationships),
        parents: parents.map(item => item.content_relationships),
      }
    } catch (error) {
      console.error('Error fetching content relationships:', error)
      throw new Error('Failed to fetch content relationships')
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

  /**
   * Delete a content relationship
   */
  static async deleteContentRelationship(
    parentContentId: string,
    childContentId: string,
    userId: string
  ): Promise<void> {
    try {
      await db.transaction(async tx => {
        // Verify user owns both content items
        const [parentContent] = await tx
          .select({ id: content.id })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(eq(content.id, parentContentId), eq(universes.userId, userId))
          )
          .limit(1)

        const [childContent] = await tx
          .select({ id: content.id })
          .from(content)
          .innerJoin(groups, eq(content.groupId, groups.id))
          .innerJoin(collections, eq(groups.collectionId, collections.id))
          .innerJoin(universes, eq(collections.universeId, universes.id))
          .where(
            and(eq(content.id, childContentId), eq(universes.userId, userId))
          )
          .limit(1)

        if (!parentContent || !childContent) {
          throw new Error('Content items not found or access denied')
        }

        // Delete the relationship
        const result = await tx
          .delete(contentRelationships)
          .where(
            and(
              eq(contentRelationships.parentContentId, parentContentId),
              eq(contentRelationships.childContentId, childContentId)
            )
          )

        if (result.rowCount === 0) {
          throw new Error('Relationship not found')
        }
      })
    } catch (error) {
      console.error('Error deleting content relationship:', error)
      throw new Error('Failed to delete content relationship')
    }
  }
}
