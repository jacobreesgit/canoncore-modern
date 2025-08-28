import 'server-only'

import { eq, and, asc, isNull } from 'drizzle-orm'
import type { ContentRelationship, Content } from '@/lib/db/schema'

/**
 * Server-side Relationship Service
 *
 * Provides server-side data access for Content relationship operations:
 * - Direct PostgreSQL access with Drizzle ORM
 * - Server-side data fetching for Server Components
 * - Enhanced security with server-only access
 * - Better performance with optimized queries
 */

export class RelationshipService {
  /**
   * Get all relationships for a universe
   */
  async getByUniverse(
    universeId: string
  ): Promise<
    Array<{ parentId: string | null; childId: string; displayOrder: number }>
  > {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      const relationships = await db
        .select({
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
          displayOrder: contentRelationships.displayOrder,
        })
        .from(contentRelationships)
        .where(eq(contentRelationships.universeId, universeId))
        .orderBy(asc(contentRelationships.displayOrder))

      return relationships
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching universe relationships:', error)
      }
      throw new Error('Failed to fetch universe relationships')
    }
  }

  /**
   * Get parent relationships for a content item
   */
  async getParents(
    contentId: string
  ): Promise<Array<{ parentId: string | null; childId: string }>> {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      const parentRelationships = await db
        .select({
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
        })
        .from(contentRelationships)
        .where(eq(contentRelationships.childId, contentId))

      return parentRelationships
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching content parents:', error)
      }
      throw new Error('Failed to fetch content parents')
    }
  }

  /**
   * Get child relationships for a content item
   */
  async getChildren(
    parentId: string | null
  ): Promise<
    Array<{ parentId: string | null; childId: string; displayOrder: number }>
  > {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      const whereCondition =
        parentId === null
          ? isNull(contentRelationships.parentId)
          : eq(contentRelationships.parentId, parentId)

      const childRelationships = await db
        .select({
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
          displayOrder: contentRelationships.displayOrder,
        })
        .from(contentRelationships)
        .where(whereCondition)
        .orderBy(asc(contentRelationships.displayOrder))

      return childRelationships
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching content children:', error)
      }
      throw new Error('Failed to fetch content children')
    }
  }

  /**
   * Create a new relationship
   */
  async create(
    parentId: string | null,
    childId: string,
    universeId: string,
    userId: string,
    displayOrder?: number
  ): Promise<ContentRelationship> {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      // If no displayOrder provided, get the next order number for this parent
      let finalDisplayOrder = displayOrder
      if (finalDisplayOrder === undefined) {
        const siblings = await this.getChildren(parentId)
        finalDisplayOrder = siblings.length
      }

      const [relationship] = await db
        .insert(contentRelationships)
        .values({
          parentId,
          childId,
          universeId,
          userId,
          displayOrder: finalDisplayOrder,
          createdAt: new Date(),
        })
        .returning()

      return relationship
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating relationship:', error)
      }
      throw new Error('Failed to create relationship')
    }
  }

  /**
   * Delete a relationship
   */
  async delete(parentId: string | null, childId: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      const whereCondition =
        parentId === null
          ? and(
              isNull(contentRelationships.parentId),
              eq(contentRelationships.childId, childId)
            )
          : and(
              eq(contentRelationships.parentId, parentId),
              eq(contentRelationships.childId, childId)
            )

      await db.delete(contentRelationships).where(whereCondition)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting relationship:', error)
      }
      throw new Error('Failed to delete relationship')
    }
  }

  /**
   * Delete all relationships for a content item (when content is deleted)
   */
  async deleteAllForContent(contentId: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      // Delete relationships where this content is the parent
      await db
        .delete(contentRelationships)
        .where(eq(contentRelationships.parentId, contentId))

      // Delete relationships where this content is the child
      await db
        .delete(contentRelationships)
        .where(eq(contentRelationships.childId, contentId))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting content relationships:', error)
      }
      throw new Error('Failed to delete content relationships')
    }
  }

  /**
   * Build hierarchy tree structure from relationships
   */
  buildHierarchyTree(
    contentItems: Content[],
    relationships: Array<{
      parentId: string | null
      childId: string
      displayOrder: number
    }>
  ): Array<Content & { children: Array<Content & { children: Content[] }> }> {
    type TreeNode = Content & {
      children: Array<Content & { children: Content[] }>
    }
    const nodeMap = new Map<string, TreeNode>()

    // Create nodes for all content
    contentItems.forEach(item => {
      nodeMap.set(item.id, {
        ...item,
        children: [],
      })
    })

    // Build parent-child relationships recursively
    const buildNode = (node: TreeNode): TreeNode => {
      const childRelations = relationships.filter(
        rel => rel.parentId === node.id
      )
      node.children = childRelations
        .sort((a, b) => a.displayOrder - b.displayOrder) // Sort by displayOrder
        .map(rel => nodeMap.get(rel.childId))
        .filter((child): child is TreeNode => child !== undefined)
        .map(child => buildNode(child))

      return node
    }

    // Find root nodes and their display order
    const rootRelations = relationships
      .filter(rel => rel.parentId === null)
      .sort((a, b) => a.displayOrder - b.displayOrder)

    const rootNodes: TreeNode[] = rootRelations
      .map(rel => nodeMap.get(rel.childId))
      .filter((node): node is TreeNode => node !== undefined)
      .map(node => buildNode(node))

    return rootNodes
  }

  /**
   * Get full hierarchy tree for a universe
   */
  async getUniverseHierarchy(
    universeId: string
  ): Promise<
    Array<Content & { children: Array<Content & { children: Content[] }> }>
  > {
    try {
      // Get all content for the universe
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const contentItems = await db
        .select()
        .from(content)
        .where(eq(content.universeId, universeId))

      // Get all relationships for the universe
      const relationships = await this.getByUniverse(universeId)

      // Build and return hierarchy tree
      return this.buildHierarchyTree(contentItems, relationships)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error building universe hierarchy:', error)
      }
      throw new Error('Failed to build universe hierarchy')
    }
  }

  /**
   * Check if creating a relationship would create a circular dependency
   */
  async wouldCreateCircularDependency(
    parentId: string,
    childId: string
  ): Promise<boolean> {
    try {
      // If parent and child are the same, it's circular
      if (parentId === childId) {
        return true
      }

      // Check if childId is already an ancestor of parentId
      return await this.isAncestor(childId, parentId)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking circular dependency:', error)
      }
      return true // Err on the side of caution
    }
  }

  /**
   * Check if potentialAncestor is an ancestor of descendant
   */
  private async isAncestor(
    potentialAncestor: string,
    descendant: string
  ): Promise<boolean> {
    try {
      const parents = await this.getParents(descendant)

      for (const parent of parents) {
        if (parent.parentId === potentialAncestor) {
          return true
        }

        // Recursively check if potentialAncestor is an ancestor of the parent
        if (
          parent.parentId &&
          (await this.isAncestor(potentialAncestor, parent.parentId))
        ) {
          return true
        }
      }

      return false
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking ancestor relationship:', error)
      }
      return false
    }
  }

  /**
   * Update display order for reordering
   */
  async updateDisplayOrder(
    parentId: string | null,
    childId: string,
    newDisplayOrder: number
  ): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { contentRelationships } = await import('@/lib/db/schema')

      const whereCondition =
        parentId === null
          ? and(
              isNull(contentRelationships.parentId),
              eq(contentRelationships.childId, childId)
            )
          : and(
              eq(contentRelationships.parentId, parentId),
              eq(contentRelationships.childId, childId)
            )

      await db
        .update(contentRelationships)
        .set({ displayOrder: newDisplayOrder })
        .where(whereCondition)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating display order:', error)
      }
      throw new Error('Failed to update display order')
    }
  }

  /**
   * Reorder children within a parent
   */
  async reorderChildren(
    parentId: string | null,
    childOrder: string[]
  ): Promise<void> {
    try {
      // Update each child's display order based on new order
      const updatePromises = childOrder.map((childId, index) =>
        this.updateDisplayOrder(parentId, childId, index)
      )

      await Promise.all(updatePromises)
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error reordering children:', error)
      }
      throw new Error('Failed to reorder children')
    }
  }

  /**
   * Get path from root to a specific content item
   */
  async getContentPath(contentId: string): Promise<string[]> {
    try {
      const path: string[] = []
      let currentId = contentId

      while (currentId) {
        path.unshift(currentId)

        const parents = await this.getParents(currentId)
        if (parents.length === 0) {
          break
        }

        // Take the first parent if multiple exist
        currentId = parents[0].parentId || ''
      }

      return path
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error getting content path:', error)
      }
      return [contentId]
    }
  }
}

export const relationshipService = new RelationshipService()
