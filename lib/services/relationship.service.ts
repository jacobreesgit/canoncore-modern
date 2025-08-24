import 'server-only'

import { db } from '@/lib/db'
import { contentRelationships, content } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
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
  ): Promise<Array<{ parentId: string; childId: string }>> {
    try {
      const relationships = await db
        .select({
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
        })
        .from(contentRelationships)
        .where(eq(contentRelationships.universeId, universeId))

      return relationships
    } catch (error) {
      console.error('Error fetching universe relationships:', error)
      throw new Error('Failed to fetch universe relationships')
    }
  }

  /**
   * Get parent relationships for a content item
   */
  async getParents(
    contentId: string
  ): Promise<Array<{ parentId: string; childId: string }>> {
    try {
      const parentRelationships = await db
        .select({
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
        })
        .from(contentRelationships)
        .where(eq(contentRelationships.childId, contentId))

      return parentRelationships
    } catch (error) {
      console.error('Error fetching content parents:', error)
      throw new Error('Failed to fetch content parents')
    }
  }

  /**
   * Get child relationships for a content item
   */
  async getChildren(
    parentId: string
  ): Promise<Array<{ parentId: string; childId: string }>> {
    try {
      const childRelationships = await db
        .select({
          parentId: contentRelationships.parentId,
          childId: contentRelationships.childId,
        })
        .from(contentRelationships)
        .where(eq(contentRelationships.parentId, parentId))

      return childRelationships
    } catch (error) {
      console.error('Error fetching content children:', error)
      throw new Error('Failed to fetch content children')
    }
  }

  /**
   * Create a new relationship
   */
  async create(
    parentId: string,
    childId: string,
    universeId: string,
    userId: string
  ): Promise<ContentRelationship> {
    try {
      const [relationship] = await db
        .insert(contentRelationships)
        .values({
          parentId,
          childId,
          universeId,
          userId,
          createdAt: new Date(),
        })
        .returning()

      return relationship
    } catch (error) {
      console.error('Error creating relationship:', error)
      throw new Error('Failed to create relationship')
    }
  }

  /**
   * Delete a relationship
   */
  async delete(parentId: string, childId: string): Promise<void> {
    try {
      await db
        .delete(contentRelationships)
        .where(
          and(
            eq(contentRelationships.parentId, parentId),
            eq(contentRelationships.childId, childId)
          )
        )
    } catch (error) {
      console.error('Error deleting relationship:', error)
      throw new Error('Failed to delete relationship')
    }
  }

  /**
   * Delete all relationships for a content item (when content is deleted)
   */
  async deleteAllForContent(contentId: string): Promise<void> {
    try {
      // Delete relationships where this content is the parent
      await db
        .delete(contentRelationships)
        .where(eq(contentRelationships.parentId, contentId))

      // Delete relationships where this content is the child
      await db
        .delete(contentRelationships)
        .where(eq(contentRelationships.childId, contentId))
    } catch (error) {
      console.error('Error deleting content relationships:', error)
      throw new Error('Failed to delete content relationships')
    }
  }

  /**
   * Build hierarchy tree structure from relationships
   */
  buildHierarchyTree(
    contentItems: Content[],
    relationships: Array<{ parentId: string; childId: string }>
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
        .map(rel => nodeMap.get(rel.childId))
        .filter((child): child is TreeNode => child !== undefined)
        .map(child => buildNode(child))

      return node
    }

    // Find root nodes (nodes without parents) and build their trees
    const rootNodes: TreeNode[] = []
    nodeMap.forEach(node => {
      const hasParent = relationships.some(rel => rel.childId === node.id)
      if (!hasParent) {
        rootNodes.push(buildNode(node))
      }
    })

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
      const contentItems = await db
        .select()
        .from(content)
        .where(eq(content.universeId, universeId))

      // Get all relationships for the universe
      const relationships = await this.getByUniverse(universeId)

      // Build and return hierarchy tree
      return this.buildHierarchyTree(contentItems, relationships)
    } catch (error) {
      console.error('Error building universe hierarchy:', error)
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
      console.error('Error checking circular dependency:', error)
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
        if (await this.isAncestor(potentialAncestor, parent.parentId)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking ancestor relationship:', error)
      return false
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
        currentId = parents[0].parentId
      }

      return path
    } catch (error) {
      console.error('Error getting content path:', error)
      return [contentId]
    }
  }
}

export const relationshipService = new RelationshipService()
