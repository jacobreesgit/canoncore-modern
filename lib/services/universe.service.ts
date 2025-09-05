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
} from '@/lib/db/schema'

export class UniverseService {
  /**
   * Create a new universe
   */
  static async create(
    data: Omit<NewUniverse, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<Universe> {
    try {
      const [universe] = await db
        .insert(universes)
        .values({
          ...data,
          userId,
        })
        .returning()

      return universe
    } catch (error) {
      console.error('Error creating universe:', error)
      throw new Error('Failed to create universe')
    }
  }

  /**
   * Get all universes for a user
   */
  static async getByUser(userId: string): Promise<Universe[]> {
    try {
      return await db
        .select()
        .from(universes)
        .where(eq(universes.userId, userId))
        .orderBy(asc(universes.order), desc(universes.createdAt))
    } catch (error) {
      console.error('Error fetching user universes:', error)
      throw new Error('Failed to fetch universes')
    }
  }

  /**
   * Get a specific universe by ID with ownership check
   */
  static async getById(id: string, userId: string): Promise<Universe | null> {
    try {
      const [universe] = await db
        .select()
        .from(universes)
        .where(and(eq(universes.id, id), eq(universes.userId, userId)))
        .limit(1)

      return universe || null
    } catch (error) {
      console.error('Error fetching universe:', error)
      throw new Error('Failed to fetch universe')
    }
  }

  /**
   * Get public universes (for discovery)
   */
  static async getPublic(): Promise<Universe[]> {
    try {
      return await db
        .select()
        .from(universes)
        .where(eq(universes.isPublic, true))
        .orderBy(desc(universes.createdAt))
    } catch (error) {
      console.error('Error fetching public universes:', error)
      throw new Error('Failed to fetch public universes')
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
  ): Promise<Universe> {
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
        throw new Error('Universe not found or access denied')
      }

      return universe
    } catch (error) {
      console.error('Error updating universe:', error)
      throw new Error('Failed to update universe')
    }
  }

  /**
   * Delete a universe with ownership check
   */
  static async delete(id: string, userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Error deleting universe:', error)
      throw new Error('Failed to delete universe')
    }
  }

  /**
   * Update universe order for a user
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    userId: string
  ): Promise<void> {
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
    } catch (error) {
      console.error('Error updating universe order:', error)
      throw new Error('Failed to update universe order')
    }
  }

  /**
   * Check if user owns universe
   */
  static async checkOwnership(id: string, userId: string): Promise<boolean> {
    try {
      const [universe] = await db
        .select({ id: universes.id })
        .from(universes)
        .where(and(eq(universes.id, id), eq(universes.userId, userId)))
        .limit(1)

      return !!universe
    } catch (error) {
      console.error('Error checking universe ownership:', error)
      return false
    }
  }

  /**
   * Get complete hierarchy for a universe (Universe → Collections → Groups → Content)
   */
  static async getCompleteHierarchy(universeId: string, userId: string) {
    try {
      // First verify user owns the universe
      const universe = await this.getById(universeId, userId)
      if (!universe) {
        throw new Error('Universe not found or access denied')
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
        .select()
        .from(groupRelationships)
        .innerJoin(groups, eq(groupRelationships.parentGroupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .where(eq(collections.universeId, universeId))

      // Fetch content relationships for hierarchy
      const contentRelationshipsData = await db
        .select()
        .from(contentRelationships)
        .innerJoin(
          content,
          eq(contentRelationships.parentContentId, content.id)
        )
        .innerJoin(groups, eq(content.groupId, groups.id))
        .innerJoin(collections, eq(groups.collectionId, collections.id))
        .where(eq(collections.universeId, universeId))

      return {
        universe,
        collections: collectionsData,
        groups: groupsData,
        content: contentData,
        groupRelationships: groupRelationshipsData,
        contentRelationships: contentRelationshipsData,
      }
    } catch (error) {
      console.error('Error fetching complete universe hierarchy:', error)
      throw new Error('Failed to fetch complete hierarchy')
    }
  }
}
