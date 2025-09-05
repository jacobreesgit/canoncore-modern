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

export class CollectionService {
  /**
   * Create a new collection
   */
  static async create(
    data: Omit<NewCollection, 'id' | 'createdAt' | 'updatedAt' | 'userId'>,
    userId: string
  ): Promise<Collection> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error creating collection:', error)
      throw new Error('Failed to create collection')
    }
  }

  /**
   * Get collections by universe with ownership check
   */
  static async getByUniverse(
    universeId: string,
    userId: string
  ): Promise<Collection[]> {
    try {
      return await db
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
    } catch (error) {
      console.error('Error fetching collections:', error)
      throw new Error('Failed to fetch collections')
    }
  }

  /**
   * Get a specific collection by ID with ownership check
   */
  static async getById(id: string, userId: string): Promise<Collection | null> {
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

      return collection || null
    } catch (error) {
      console.error('Error fetching collection:', error)
      throw new Error('Failed to fetch collection')
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
  ): Promise<Collection> {
    try {
      return await db.transaction(async tx => {
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
    } catch (error) {
      console.error('Error updating collection:', error)
      throw new Error('Failed to update collection')
    }
  }

  /**
   * Delete a collection with ownership check
   */
  static async delete(id: string, userId: string): Promise<void> {
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
    } catch (error) {
      console.error('Error deleting collection:', error)
      throw new Error('Failed to delete collection')
    }
  }

  /**
   * Update collection order within a universe
   */
  static async updateOrder(
    orderUpdates: { id: string; order: number }[],
    universeId: string,
    userId: string
  ): Promise<void> {
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
    } catch (error) {
      console.error('Error updating collection order:', error)
      throw new Error('Failed to update collection order')
    }
  }

  /**
   * Check if user has access to collection
   */
  static async checkAccess(id: string, userId: string): Promise<boolean> {
    try {
      const [collection] = await db
        .select({ id: collections.id })
        .from(collections)
        .innerJoin(universes, eq(collections.universeId, universes.id))
        .where(and(eq(collections.id, id), eq(universes.userId, userId)))
        .limit(1)

      return !!collection
    } catch (error) {
      console.error('Error checking collection access:', error)
      return false
    }
  }

  /**
   * Get complete hierarchy for a collection (Collection → Groups → Content)
   */
  static async getCompleteHierarchy(collectionId: string, userId: string) {
    try {
      // First verify user has access to the collection
      const collection = await this.getById(collectionId, userId)
      if (!collection) {
        throw new Error('Collection not found or access denied')
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
        })
        .from(content)
        .innerJoin(groups, eq(content.groupId, groups.id))
        .where(eq(groups.collectionId, collectionId))
        .orderBy(asc(content.order), desc(content.createdAt))

      // Fetch group relationships for hierarchy
      const groupRelationshipsData = await db
        .select()
        .from(groupRelationships)
        .innerJoin(groups, eq(groupRelationships.parentGroupId, groups.id))
        .where(eq(groups.collectionId, collectionId))

      // Fetch content relationships for hierarchy
      const contentRelationshipsData = await db
        .select()
        .from(contentRelationships)
        .innerJoin(
          content,
          eq(contentRelationships.parentContentId, content.id)
        )
        .innerJoin(groups, eq(content.groupId, groups.id))
        .where(eq(groups.collectionId, collectionId))

      return {
        collection,
        groups: groupsData,
        content: contentData,
        groupRelationships: groupRelationshipsData,
        contentRelationships: contentRelationshipsData,
      }
    } catch (error) {
      console.error('Error fetching complete collection hierarchy:', error)
      throw new Error('Failed to fetch complete hierarchy')
    }
  }
}
