import 'server-only'

import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm'
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
        .orderBy(asc(content.createdAt))

      return universeContent
    } catch (error) {
      console.error('Error fetching universe content:', error)
      throw new Error('Failed to fetch universe content')
    }
  }

  /**
   * Get content by universe ID with sources and user progress
   */
  async getByUniverseWithSourcesAndProgress(
    universeId: string,
    userId: string
  ): Promise<
    (Content & {
      progress?: number
      sourceName?: string | null
      sourceBackgroundColor?: string | null
      sourceTextColor?: string | null
    })[]
  > {
    try {
      const { db } = await import('@/lib/db')
      const { content, sources, userProgress } = await import('@/lib/db/schema')

      // Get all content with sources
      const contentWithSources = await db
        .select({
          id: content.id,
          name: content.name,
          description: content.description,
          universeId: content.universeId,
          userId: content.userId,
          isViewable: content.isViewable,
          itemType: content.itemType,
          sourceId: content.sourceId,
          sourceLink: content.sourceLink,
          sourceLinkName: content.sourceLinkName,
          createdAt: content.createdAt,
          updatedAt: content.updatedAt,
          sourceName: sources.name,
          sourceBackgroundColor: sources.backgroundColor,
          sourceTextColor: sources.textColor,
        })
        .from(content)
        .leftJoin(sources, eq(content.sourceId, sources.id))
        .where(eq(content.universeId, universeId))
        .orderBy(asc(content.createdAt))

      // Get user progress for all content in this universe
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
        contentWithSources.map(async contentItem => {
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
      console.error(
        'Error fetching universe content with sources and progress:',
        error
      )
      throw new Error(
        'Failed to fetch universe content with sources and progress'
      )
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
            childIds.length === 1
              ? eq(content.id, childIds[0])
              : inArray(content.id, childIds),
            eq(content.isViewable, true)
          )
        )

      if (viewableChildren.length === 0) {
        return 0
      }

      // Get progress for viewable children
      const viewableChildIds = viewableChildren.map(c => c.id)
      const childProgress = await db
        .select({ progress: userProgress.progress })
        .from(userProgress)
        .where(
          and(
            viewableChildIds.length === 1
              ? eq(userProgress.contentId, viewableChildIds[0])
              : inArray(userProgress.contentId, viewableChildIds),
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
   * Get universe by content ID
   */
  async getUniverse(contentId: string) {
    try {
      const { db } = await import('@/lib/db')
      const { content, universes } = await import('@/lib/db/schema')

      const [result] = await db
        .select({
          id: universes.id,
          name: universes.name,
          description: universes.description,
          isPublic: universes.isPublic,
          userId: universes.userId,
          createdAt: universes.createdAt,
          updatedAt: universes.updatedAt,
          sourceLink: universes.sourceLink,
          sourceLinkName: universes.sourceLinkName,
        })
        .from(content)
        .innerJoin(universes, eq(content.universeId, universes.id))
        .where(eq(content.id, contentId))
        .limit(1)

      return result || null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching universe for content:', error)
      }
      throw new Error('Failed to fetch universe for content')
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

  /**
   * Get source information for content
   */
  async getContentSource(contentId: string) {
    try {
      const { db } = await import('@/lib/db')
      const { content, sources } = await import('@/lib/db/schema')

      const [result] = await db
        .select({
          sourceName: sources.name,
          sourceBackgroundColor: sources.backgroundColor,
          sourceTextColor: sources.textColor,
        })
        .from(content)
        .leftJoin(sources, eq(content.sourceId, sources.id))
        .where(eq(content.id, contentId))
        .limit(1)

      return result || null
    } catch (error) {
      console.error('Error fetching content source:', error)
      return null
    }
  }
}

export const contentService = new ContentService()
