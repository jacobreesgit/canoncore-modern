import 'server-only'

import { eq, and, desc, sql } from 'drizzle-orm'
import type { Content, NewContent } from '@/lib/db/schema'

/**
 * Server-side Content Service
 *
 * Provides server-side data access for Content operations:
 * - Direct PostgreSQL access with Drizzle ORM
 * - Server-side data fetching for Server Components
 * - Enhanced security with server-only access
 * - Better performance with optimized queries
 */

export class ContentService {
  /**
   * Get content by ID
   */
  async getById(id: string): Promise<Content | null> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const [contentItem] = await db
        .select()
        .from(content)
        .where(eq(content.id, id))
        .limit(1)

      return contentItem || null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching content:', error)
      }
      throw new Error('Failed to fetch content')
    }
  }

  /**
   * Get content by ID with user progress
   */
  async getByIdWithUserProgress(
    id: string,
    userId: string
  ): Promise<(Content & { progress?: number }) | null> {
    try {
      const contentItem = await this.getById(id)
      if (!contentItem) {
        return null
      }

      // Get user progress for this content if it's viewable
      let progress = 0
      if (contentItem.isViewable) {
        const { db } = await import('@/lib/db')
        const { userProgress } = await import('@/lib/db/schema')

        const [progressData] = await db
          .select({ progress: userProgress.progress })
          .from(userProgress)
          .where(
            and(eq(userProgress.contentId, id), eq(userProgress.userId, userId))
          )
          .limit(1)

        progress = progressData?.progress || 0
      } else {
        // For organisational content, calculate progress from children
        progress = await this.calculateOrganisationalProgress(id, userId)
      }

      return {
        ...contentItem,
        progress,
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching content with user progress:', error)
      }
      throw new Error('Failed to fetch content with user progress')
    }
  }

  /**
   * Create new content
   */
  async create(contentData: NewContent): Promise<Content> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const [newContent] = await db
        .insert(content)
        .values({
          ...contentData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      return newContent
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating content:', error)
      }
      throw new Error('Failed to create content')
    }
  }

  /**
   * Update content
   */
  async update(
    id: string,
    updateData: Partial<NewContent>
  ): Promise<Content | null> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const [updatedContent] = await db
        .update(content)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(content.id, id))
        .returning()

      return updatedContent || null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating content:', error)
      }
      throw new Error('Failed to update content')
    }
  }

  /**
   * Delete content
   */
  async delete(id: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      await db.delete(content).where(eq(content.id, id))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting content:', error)
      }
      throw new Error('Failed to delete content')
    }
  }

  /**
   * Get content by universe ID
   */
  async getByUniverse(universeId: string): Promise<Content[]> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const universeContent = await db
        .select()
        .from(content)
        .where(eq(content.universeId, universeId))
        .orderBy(desc(content.createdAt))

      return universeContent
    } catch (error) {
      console.error('Error fetching universe content:', error)
      throw new Error('Failed to fetch universe content')
    }
  }

  /**
   * Get content by universe ID with user progress
   */
  async getByUniverseWithUserProgress(
    universeId: string,
    userId: string
  ): Promise<(Content & { progress?: number })[]> {
    try {
      const universeContent = await this.getByUniverse(universeId)

      // Get user progress for all content in this universe
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      const progressData = await db
        .select({
          contentId: userProgress.contentId,
          progress: userProgress.progress,
        })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.universeId, universeId),
            eq(userProgress.userId, userId)
          )
        )

      const progressMap = new Map(
        progressData.map(p => [p.contentId, p.progress])
      )

      // Calculate progress for each content item
      const contentWithProgress = await Promise.all(
        universeContent.map(async contentItem => {
          let progress = 0

          if (contentItem.isViewable) {
            // Direct progress for viewable content
            progress = progressMap.get(contentItem.id) || 0
          } else {
            // Calculated progress for organisational content
            progress = await this.calculateOrganisationalProgress(
              contentItem.id,
              userId
            )
          }

          return {
            ...contentItem,
            progress,
          }
        })
      )

      return contentWithProgress
    } catch (error) {
      console.error('Error fetching universe content with progress:', error)
      throw new Error('Failed to fetch universe content with progress')
    }
  }

  /**
   * Get viewable content by universe ID
   */
  async getViewableByUniverse(universeId: string): Promise<Content[]> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const viewableContent = await db
        .select()
        .from(content)
        .where(
          and(eq(content.universeId, universeId), eq(content.isViewable, true))
        )
        .orderBy(desc(content.createdAt))

      return viewableContent
    } catch (error) {
      console.error('Error fetching viewable content:', error)
      throw new Error('Failed to fetch viewable content')
    }
  }

  /**
   * Get organisational content by universe ID
   */
  async getOrganisationalByUniverse(universeId: string): Promise<Content[]> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const organisationalContent = await db
        .select()
        .from(content)
        .where(
          and(eq(content.universeId, universeId), eq(content.isViewable, false))
        )
        .orderBy(desc(content.createdAt))

      return organisationalContent
    } catch (error) {
      console.error('Error fetching organisational content:', error)
      throw new Error('Failed to fetch organisational content')
    }
  }

  /**
   * Calculate progress for organisational content based on children
   */
  async calculateOrganisationalProgress(
    parentId: string,
    userId: string
  ): Promise<number> {
    try {
      const { db } = await import('@/lib/db')
      const { content, userProgress, contentRelationships } = await import(
        '@/lib/db/schema'
      )

      // Get all child content IDs
      const childRelations = await db
        .select({ childId: contentRelationships.childId })
        .from(contentRelationships)
        .where(eq(contentRelationships.parentId, parentId))

      if (childRelations.length === 0) {
        return 0
      }

      const childIds = childRelations.map(r => r.childId)

      // Get viewable children
      const viewableChildren = await db
        .select({ id: content.id })
        .from(content)
        .where(
          and(
            sql`${content.id} = ANY(${childIds})`,
            eq(content.isViewable, true)
          )
        )

      if (viewableChildren.length === 0) {
        return 0
      }

      // Get progress for viewable children
      const childProgress = await db
        .select({ progress: userProgress.progress })
        .from(userProgress)
        .where(
          and(
            sql`${userProgress.contentId} = ANY(${viewableChildren.map(c => c.id)})`,
            eq(userProgress.userId, userId)
          )
        )

      if (childProgress.length === 0) {
        return 0
      }

      // Calculate average progress
      const totalProgress = childProgress.reduce(
        (sum, p) => sum + p.progress,
        0
      )
      const averageProgress = Math.round(
        totalProgress / viewableChildren.length
      )

      return Math.min(100, Math.max(0, averageProgress))
    } catch (error) {
      console.error('Error calculating organisational progress:', error)
      return 0
    }
  }

  /**
   * Search content by name within a universe
   */
  async searchInUniverse(
    universeId: string,
    searchTerm: string
  ): Promise<Content[]> {
    try {
      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      const searchResults = await db
        .select()
        .from(content)
        .where(
          and(
            eq(content.universeId, universeId),
            sql`${content.name} ILIKE ${`%${searchTerm}%`}`
          )
        )
        .orderBy(desc(content.createdAt))

      return searchResults
    } catch (error) {
      console.error('Error searching content:', error)
      throw new Error('Failed to search content')
    }
  }
}

export const contentService = new ContentService()
