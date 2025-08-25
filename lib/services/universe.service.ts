import 'server-only'

import { eq, and, desc, count, sql } from 'drizzle-orm'
import type { Universe, NewUniverse } from '@/lib/db/schema'

/**
 * Server-side Universe Service
 *
 * Provides server-side data access for Universe operations:
 * - Direct PostgreSQL access with Drizzle ORM
 * - Server-side data fetching for Server Components
 * - Enhanced security with server-only access
 * - Better performance with optimized queries
 */

export class UniverseService {
  /**
   * Get universe by ID
   */
  async getById(id: string): Promise<Universe | null> {
    const { DatabaseQueries } = await import('@/lib/db/queries')
    const { withPerformanceMonitoring } = await import(
      '@/lib/db/connection-pool'
    )
    const optimizedGetById = withPerformanceMonitoring(
      DatabaseQueries.getUniverseById,
      'universe.getById'
    )
    return await optimizedGetById(id)
  }

  /**
   * Get universe by ID with user progress
   */
  async getByIdWithUserProgress(
    id: string,
    userId: string
  ): Promise<(Universe & { progress?: number }) | null> {
    try {
      const universe = await this.getById(id)
      if (!universe) {
        return null
      }

      // Calculate progress for this universe based on user's content progress
      const progress = await this.calculateUniverseProgress(id, userId)

      return {
        ...universe,
        progress,
      }
    } catch (error) {
      console.error('Error fetching universe with user progress:', error)
      throw new Error('Failed to fetch universe with user progress')
    }
  }

  /**
   * Create a new universe
   */
  async create(universeData: NewUniverse): Promise<Universe> {
    try {
      const { db } = await import('@/lib/db')
      const { universes } = await import('@/lib/db/schema')

      const [newUniverse] = await db
        .insert(universes)
        .values({
          ...universeData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      return newUniverse
    } catch (error) {
      console.error('Error creating universe:', error)
      throw new Error('Failed to create universe')
    }
  }

  /**
   * Update universe
   */
  async update(
    id: string,
    updateData: Partial<NewUniverse>
  ): Promise<Universe | null> {
    try {
      const { db } = await import('@/lib/db')
      const { universes } = await import('@/lib/db/schema')

      const [updatedUniverse] = await db
        .update(universes)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(universes.id, id))
        .returning()

      return updatedUniverse || null
    } catch (error) {
      console.error('Error updating universe:', error)
      throw new Error('Failed to update universe')
    }
  }

  /**
   * Delete universe
   */
  async delete(id: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { universes } = await import('@/lib/db/schema')

      await db.delete(universes).where(eq(universes.id, id))
    } catch (error) {
      console.error('Error deleting universe:', error)
      throw new Error('Failed to delete universe')
    }
  }

  /**
   * Get universes by user ID
   */
  async getByUserId(userId: string): Promise<Universe[]> {
    const { DatabaseQueries } = await import('@/lib/db/queries')
    const { withPerformanceMonitoring } = await import(
      '@/lib/db/connection-pool'
    )
    const optimizedGetByUser = withPerformanceMonitoring(
      DatabaseQueries.getUniversesByUserId,
      'universe.getByUserId'
    )
    return await optimizedGetByUser(userId)
  }

  /**
   * Get universes by user ID with progress
   */
  async getByUserIdWithProgress(
    userId: string
  ): Promise<(Universe & { progress?: number })[]> {
    try {
      const userUniverses = await this.getByUserId(userId)

      // Calculate progress for each universe
      const universesWithProgress = await Promise.all(
        userUniverses.map(async universe => {
          const progress = await this.calculateUniverseProgress(
            universe.id,
            userId
          )
          return {
            ...universe,
            progress,
          }
        })
      )

      return universesWithProgress
    } catch (error) {
      console.error('Error fetching user universes with progress:', error)
      throw new Error('Failed to fetch user universes with progress')
    }
  }

  /**
   * Get public universes for discovery page
   */
  async getPublicUniverses(options?: {
    limitCount?: number
    searchQuery?: string
    sortBy?: 'newest' | 'oldest' | 'name'
  }): Promise<Universe[]> {
    const { limitCount = 20, searchQuery } = options || {}
    const { DatabaseQueries } = await import('@/lib/db/queries')
    const { withPerformanceMonitoring } = await import(
      '@/lib/db/connection-pool'
    )

    const optimizedGetPublic = withPerformanceMonitoring(
      DatabaseQueries.getPublicUniverses,
      'universe.getPublicUniverses'
    )
    const queryOptions: {
      limit: number
      searchQuery?: string
      sortBy?: 'newest' | 'oldest' | 'name'
    } = { limit: limitCount }

    if (searchQuery && searchQuery.trim()) {
      queryOptions.searchQuery = searchQuery.trim()
    }

    if (options?.sortBy) {
      queryOptions.sortBy = options.sortBy
    } else {
      queryOptions.sortBy = 'newest'
    }

    return await optimizedGetPublic(queryOptions)
  }

  /**
   * Calculate universe progress based on user's content progress
   */
  async calculateUniverseProgress(
    universeId: string,
    userId: string
  ): Promise<number> {
    try {
      const { db } = await import('@/lib/db')
      const { content, userProgress } = await import('@/lib/db/schema')

      // Get all viewable content in this universe
      const viewableContent = await db
        .select({ id: content.id })
        .from(content)
        .where(
          and(eq(content.universeId, universeId), eq(content.isViewable, true))
        )

      if (viewableContent.length === 0) {
        return 0
      }

      // Get user progress for viewable content
      const progressData = await db
        .select({
          progress: userProgress.progress,
        })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.universeId, universeId)
          )
        )

      if (progressData.length === 0) {
        return 0
      }

      // Calculate average progress
      const totalProgress = progressData.reduce(
        (sum, item) => sum + item.progress,
        0
      )
      const averageProgress = Math.round(totalProgress / viewableContent.length)

      return Math.min(100, Math.max(0, averageProgress))
    } catch (error) {
      console.error('Error calculating universe progress:', error)
      return 0
    }
  }

  /**
   * Get universe with detailed content statistics
   */
  async getWithContentStats(id: string): Promise<
    | (Universe & {
        totalContent: number
        viewableContent: number
        organisationalContent: number
      })
    | null
  > {
    try {
      const universe = await this.getById(id)
      if (!universe) {
        return null
      }

      const { db } = await import('@/lib/db')
      const { content } = await import('@/lib/db/schema')

      // Get content statistics
      const contentStats = await db
        .select({
          totalContent: count(),
          viewableContent: sql<number>`sum(case when ${content.isViewable} = true then 1 else 0 end)`,
          organisationalContent: sql<number>`sum(case when ${content.isViewable} = false then 1 else 0 end)`,
        })
        .from(content)
        .where(eq(content.universeId, id))

      const stats = contentStats[0] || {
        totalContent: 0,
        viewableContent: 0,
        organisationalContent: 0,
      }

      return {
        ...universe,
        totalContent: stats.totalContent,
        viewableContent: Number(stats.viewableContent),
        organisationalContent: Number(stats.organisationalContent),
      }
    } catch (error) {
      console.error('Error fetching universe with content stats:', error)
      throw new Error('Failed to fetch universe with content stats')
    }
  }

  /**
   * Search public universes by name
   */
  async searchPublic(
    searchTerm: string,
    limitCount: number = 20
  ): Promise<Universe[]> {
    try {
      const { db } = await import('@/lib/db')
      const { universes } = await import('@/lib/db/schema')

      const searchResults = await db
        .select()
        .from(universes)
        .where(
          and(
            eq(universes.isPublic, true),
            sql`${universes.name} ILIKE ${`%${searchTerm}%`}`
          )
        )
        .orderBy(desc(universes.createdAt))
        .limit(limitCount)

      return searchResults
    } catch (error) {
      console.error('Error searching public universes:', error)
      throw new Error('Failed to search public universes')
    }
  }
}

export const universeService = new UniverseService()
