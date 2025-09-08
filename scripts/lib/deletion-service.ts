import { db } from './db-cli.js'
import { 
  users, 
  universes, 
  collections, 
  groups, 
  content,
  accounts,
  sessions,
  groupRelationships,
  contentRelationships
} from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
// Note: Not importing services to avoid server-only dependencies
// Will handle deletions directly using database transactions
import { AppError } from './error-handling'

export interface DeletionPreview {
  id: string
  name: string
  type: string
}

export interface DeletionResult {
  success: boolean
  deletedCount?: number
  error?: string
}

export class DeletionService {
  /**
   * Get preview of what will be deleted for a specific entity
   * Follows Context7 best practice of showing impact before execution
   */
  async getDeletePreview(entityType: string, id: string): Promise<DeletionPreview[]> {
    try {
      switch (entityType) {
        case 'users':
          return await this.getUserDataPreview(id)
        
        case 'universes':
          return await this.getUniversePreview(id)
          
        case 'collections':
          return await this.getCollectionPreview(id)
          
        case 'groups':
          return await this.getGroupPreview(id)
          
        case 'content':
          return await this.getContentPreview(id)
          
        default:
          throw new AppError(`Unsupported entity type: ${entityType}`, true)
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to get deletion preview: ${(error as Error).message}`, false)
    }
  }

  /**
   * Get preview of all data that will be deleted for a user
   * Shows cascading effect following foreign key relationships
   */
  async getUserDataPreview(userId: string): Promise<DeletionPreview[]> {
    const preview: DeletionPreview[] = []

    try {
      // Check if user exists
      const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
      if (user.length === 0) {
        return preview
      }

      // Add user to preview
      preview.push({
        id: user[0].id,
        name: user[0].name || user[0].email,
        type: 'user'
      })

      // Get all universes for this user
      const userUniverses = await db
        .select({ id: universes.id, name: universes.name })
        .from(universes)
        .where(eq(universes.userId, userId))

      for (const universe of userUniverses) {
        preview.push({
          id: universe.id,
          name: universe.name,
          type: 'universe'
        })

        // Get collections in this universe
        const universeCollections = await db
          .select({ id: collections.id, name: collections.name })
          .from(collections)
          .where(eq(collections.universeId, universe.id))

        for (const collection of universeCollections) {
          preview.push({
            id: collection.id,
            name: collection.name,
            type: 'collection'
          })

          // Get groups in this collection
          const collectionGroups = await db
            .select({ id: groups.id, name: groups.name })
            .from(groups)
            .where(eq(groups.collectionId, collection.id))

          for (const group of collectionGroups) {
            preview.push({
              id: group.id,
              name: group.name,
              type: 'group'
            })

            // Get content in this group
            const groupContent = await db
              .select({ id: content.id, name: content.name })
              .from(content)
              .where(eq(content.groupId, group.id))

            for (const contentItem of groupContent) {
              preview.push({
                id: contentItem.id,
                name: contentItem.name,
                type: 'content'
              })
            }
          }
        }
      }

      return preview
    } catch (error) {
      throw new AppError(`Failed to get user data preview: ${(error as Error).message}`, false)
    }
  }

  /**
   * Get preview for universe deletion (includes all child entities)
   */
  private async getUniversePreview(universeId: string): Promise<DeletionPreview[]> {
    const preview: DeletionPreview[] = []

    try {
      const universe = await db
        .select({ id: universes.id, name: universes.name })
        .from(universes)
        .where(eq(universes.id, universeId))
        .limit(1)

      if (universe.length === 0) return preview

      preview.push({
        id: universe[0].id,
        name: universe[0].name,
        type: 'universe'
      })

      // Get all collections, groups, and content in this universe
      const universeCollections = await db
        .select({ id: collections.id, name: collections.name })
        .from(collections)
        .where(eq(collections.universeId, universeId))

      for (const collection of universeCollections) {
        preview.push({
          id: collection.id,
          name: collection.name,
          type: 'collection'
        })

        // Get groups and content (same logic as getUserDataPreview)
        const collectionGroups = await db
          .select({ id: groups.id, name: groups.name })
          .from(groups)
          .where(eq(groups.collectionId, collection.id))

        for (const group of collectionGroups) {
          preview.push({
            id: group.id,
            name: group.name,
            type: 'group'
          })

          const groupContent = await db
            .select({ id: content.id, name: content.name })
            .from(content)
            .where(eq(content.groupId, group.id))

          for (const contentItem of groupContent) {
            preview.push({
              id: contentItem.id,
              name: contentItem.name,
              type: 'content'
            })
          }
        }
      }

      return preview
    } catch (error) {
      throw new AppError(`Failed to get universe preview: ${(error as Error).message}`, false)
    }
  }

  /**
   * Get preview for collection deletion
   */
  private async getCollectionPreview(collectionId: string): Promise<DeletionPreview[]> {
    const preview: DeletionPreview[] = []

    try {
      const collection = await db
        .select({ id: collections.id, name: collections.name })
        .from(collections)
        .where(eq(collections.id, collectionId))
        .limit(1)

      if (collection.length === 0) return preview

      preview.push({
        id: collection[0].id,
        name: collection[0].name,
        type: 'collection'
      })

      // Get all groups and content in this collection
      const collectionGroups = await db
        .select({ id: groups.id, name: groups.name })
        .from(groups)
        .where(eq(groups.collectionId, collectionId))

      for (const group of collectionGroups) {
        preview.push({
          id: group.id,
          name: group.name,
          type: 'group'
        })

        const groupContent = await db
          .select({ id: content.id, name: content.name })
          .from(content)
          .where(eq(content.groupId, group.id))

        for (const contentItem of groupContent) {
          preview.push({
            id: contentItem.id,
            name: contentItem.name,
            type: 'content'
          })
        }
      }

      return preview
    } catch (error) {
      throw new AppError(`Failed to get collection preview: ${(error as Error).message}`, false)
    }
  }

  /**
   * Get preview for group deletion
   */
  private async getGroupPreview(groupId: string): Promise<DeletionPreview[]> {
    const preview: DeletionPreview[] = []

    try {
      const group = await db
        .select({ id: groups.id, name: groups.name })
        .from(groups)
        .where(eq(groups.id, groupId))
        .limit(1)

      if (group.length === 0) return preview

      preview.push({
        id: group[0].id,
        name: group[0].name,
        type: 'group'
      })

      // Get all content in this group
      const groupContent = await db
        .select({ id: content.id, name: content.name })
        .from(content)
        .where(eq(content.groupId, groupId))

      for (const contentItem of groupContent) {
        preview.push({
          id: contentItem.id,
          name: contentItem.name,
          type: 'content'
        })
      }

      return preview
    } catch (error) {
      throw new AppError(`Failed to get group preview: ${(error as Error).message}`, false)
    }
  }

  /**
   * Get preview for content deletion
   */
  private async getContentPreview(contentId: string): Promise<DeletionPreview[]> {
    const preview: DeletionPreview[] = []

    try {
      const contentItem = await db
        .select({ id: content.id, name: content.name })
        .from(content)
        .where(eq(content.id, contentId))
        .limit(1)

      if (contentItem.length === 0) return preview

      preview.push({
        id: contentItem[0].id,
        name: contentItem[0].name,
        type: 'content'
      })

      return preview
    } catch (error) {
      throw new AppError(`Failed to get content preview: ${(error as Error).message}`, false)
    }
  }

  /**
   * Delete a specific entity using direct database operations
   * Handles cascading deletions based on database constraints
   */
  async deleteEntity(entityType: string, id: string): Promise<DeletionResult> {
    try {
      switch (entityType) {
        case 'users':
          return await this.deleteUserData(id)
        
        case 'universes':
          return await this.deleteUniverse(id)
          
        case 'collections':
          return await this.deleteCollection(id)
          
        case 'groups':
          return await this.deleteGroup(id)
          
        case 'content':
          return await this.deleteContent(id)
          
        default:
          throw new AppError(`Unsupported entity type: ${entityType}`, true)
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      return {
        success: false,
        error: `Failed to delete ${entityType}: ${(error as Error).message}`
      }
    }
  }

  /**
   * Delete all data for a user including the user account
   * Uses database transaction for atomicity (Context7 best practice)
   */
  async deleteUserData(userId: string): Promise<DeletionResult> {
    try {
      return await db.transaction(async (tx) => {
        let deletedCount = 0

        // Delete in correct order to respect foreign key constraints
        
        // 1. Delete content relationships first
        await tx.delete(contentRelationships)
          .where(eq(contentRelationships.parentContentId, 
            tx.select({ id: content.id }).from(content).where(eq(content.userId, userId))
          ))
        
        await tx.delete(contentRelationships)
          .where(eq(contentRelationships.childContentId, 
            tx.select({ id: content.id }).from(content).where(eq(content.userId, userId))
          ))

        // 2. Delete group relationships
        await tx.delete(groupRelationships)
          .where(eq(groupRelationships.parentGroupId, 
            tx.select({ id: groups.id }).from(groups).where(eq(groups.userId, userId))
          ))
        
        await tx.delete(groupRelationships)
          .where(eq(groupRelationships.childGroupId, 
            tx.select({ id: groups.id }).from(groups).where(eq(groups.userId, userId))
          ))

        // 3. Delete content (cascades handled by DB)
        const deletedContent = await tx.delete(content).where(eq(content.userId, userId))
        deletedCount += deletedContent.rowCount || 0

        // 4. Delete groups
        const deletedGroups = await tx.delete(groups).where(eq(groups.userId, userId))
        deletedCount += deletedGroups.rowCount || 0

        // 5. Delete collections
        const deletedCollections = await tx.delete(collections).where(eq(collections.userId, userId))
        deletedCount += deletedCollections.rowCount || 0

        // 6. Delete universes
        const deletedUniverses = await tx.delete(universes).where(eq(universes.userId, userId))
        deletedCount += deletedUniverses.rowCount || 0

        // 7. Delete NextAuth sessions and accounts
        await tx.delete(sessions).where(eq(sessions.userId, userId))
        await tx.delete(accounts).where(eq(accounts.userId, userId))

        // 8. Finally delete the user
        const deletedUsers = await tx.delete(users).where(eq(users.id, userId))
        deletedCount += deletedUsers.rowCount || 0

        return {
          success: true,
          deletedCount
        }
      })
    } catch (error) {
      throw new AppError(`Failed to delete user data: ${(error as Error).message}`, false)
    }
  }

  /**
   * Delete a specific universe and all its child entities
   * Database cascading deletes handle the relationships automatically
   */
  private async deleteUniverse(universeId: string): Promise<DeletionResult> {
    try {
      return await db.transaction(async (tx) => {
        // Check if universe exists
        const universe = await tx.select().from(universes).where(eq(universes.id, universeId)).limit(1)
        if (universe.length === 0) {
          throw new AppError(`Universe with ID ${universeId} not found`, true)
        }

        // Delete universe (cascading deletes will handle child entities)
        const result = await tx.delete(universes).where(eq(universes.id, universeId))
        
        return {
          success: true,
          deletedCount: result.rowCount || 0
        }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to delete universe: ${(error as Error).message}`, false)
    }
  }

  /**
   * Delete a specific collection and all its child entities
   */
  private async deleteCollection(collectionId: string): Promise<DeletionResult> {
    try {
      return await db.transaction(async (tx) => {
        // Check if collection exists
        const collection = await tx.select().from(collections).where(eq(collections.id, collectionId)).limit(1)
        if (collection.length === 0) {
          throw new AppError(`Collection with ID ${collectionId} not found`, true)
        }

        // Delete collection (cascading deletes will handle child entities)
        const result = await tx.delete(collections).where(eq(collections.id, collectionId))
        
        return {
          success: true,
          deletedCount: result.rowCount || 0
        }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to delete collection: ${(error as Error).message}`, false)
    }
  }

  /**
   * Delete a specific group and all its child entities
   */
  private async deleteGroup(groupId: string): Promise<DeletionResult> {
    try {
      return await db.transaction(async (tx) => {
        // Check if group exists
        const group = await tx.select().from(groups).where(eq(groups.id, groupId)).limit(1)
        if (group.length === 0) {
          throw new AppError(`Group with ID ${groupId} not found`, true)
        }

        // Delete group (cascading deletes will handle child entities)
        const result = await tx.delete(groups).where(eq(groups.id, groupId))
        
        return {
          success: true,
          deletedCount: result.rowCount || 0
        }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to delete group: ${(error as Error).message}`, false)
    }
  }

  /**
   * Delete a specific content item
   */
  private async deleteContent(contentId: string): Promise<DeletionResult> {
    try {
      return await db.transaction(async (tx) => {
        // Check if content exists
        const contentItem = await tx.select().from(content).where(eq(content.id, contentId)).limit(1)
        if (contentItem.length === 0) {
          throw new AppError(`Content with ID ${contentId} not found`, true)
        }

        // Delete content
        const result = await tx.delete(content).where(eq(content.id, contentId))
        
        return {
          success: true,
          deletedCount: result.rowCount || 0
        }
      })
    } catch (error) {
      if (error instanceof AppError) throw error
      throw new AppError(`Failed to delete content: ${(error as Error).message}`, false)
    }
  }
}