import 'server-only'

import { eq, and, count, sql } from 'drizzle-orm'
import type { UserProgress, NewUserProgress, Content } from '@/lib/db/schema'

/**
 * Server-side Progress Service
 *
 * Provides server-side data access for User Progress operations:
 * - Direct PostgreSQL access with Drizzle ORM
 * - Server-side data fetching for Server Components
 * - Enhanced security with server-only access
 * - Better performance with optimized queries
 */

export class ProgressService {
  /**
   * Get user progress for specific content
   */
  async getUserProgress(userId: string, contentId: string): Promise<number> {
    try {
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      const [progressData] = await db
        .select({ progress: userProgress.progress })
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.contentId, contentId)
          )
        )
        .limit(1)

      return progressData?.progress || 0
    } catch (error) {
      console.error('Error fetching user progress:', error)
      return 0
    }
  }

  /**
   * Get all user progress for a universe
   */
  async getUserProgressByUniverse(
    userId: string,
    universeId: string
  ): Promise<Record<string, number>> {
    try {
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
            eq(userProgress.userId, userId),
            eq(userProgress.universeId, universeId)
          )
        )

      const progressMap: Record<string, number> = {}

      progressData.forEach(item => {
        progressMap[item.contentId] = item.progress || 0
      })

      return progressMap
    } catch (error) {
      console.error('Error fetching universe progress:', error)
      return {}
    }
  }

  /**
   * Set user progress for content
   */
  async setUserProgress(
    userId: string,
    progressData: {
      contentId: string
      universeId: string
      progress: number
    }
  ): Promise<UserProgress> {
    try {
      // Clamp progress between 0-100
      const clampedProgress = Math.min(100, Math.max(0, progressData.progress))

      const newProgressData: NewUserProgress = {
        userId,
        contentId: progressData.contentId,
        universeId: progressData.universeId,
        progress: clampedProgress,
        updatedAt: new Date(),
      }

      // Check if progress entry already exists
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      const [existingProgress] = await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, userId),
            eq(userProgress.contentId, progressData.contentId)
          )
        )
        .limit(1)

      if (existingProgress) {
        // Update existing progress entry
        const [updatedProgress] = await db
          .update(userProgress)
          .set(newProgressData)
          .where(eq(userProgress.id, existingProgress.id))
          .returning()

        return updatedProgress
      } else {
        // Create new progress entry
        const [createdProgress] = await db
          .insert(userProgress)
          .values({
            ...newProgressData,
            createdAt: new Date(),
          })
          .returning()

        return createdProgress
      }
    } catch (error) {
      console.error('Error setting user progress:', error)
      throw new Error('Failed to set user progress')
    }
  }

  /**
   * Calculate organisational progress for content with children
   */
  async calculateOrganisationalProgress(
    contentId: string,
    userId: string,
    allContent: Content[],
    relationships: Array<{ parentId: string; childId: string }>
  ): Promise<number> {
    try {
      // Get direct children of this content
      const childIds = relationships
        .filter(rel => rel.parentId === contentId)
        .map(rel => rel.childId)

      if (childIds.length === 0) {
        return 0
      }

      let totalProgress = 0
      let progressCount = 0

      for (const childId of childIds) {
        const child = allContent.find(c => c.id === childId)
        if (!child) continue

        if (child.isViewable) {
          // Get direct user progress for viewable content
          const progress = await this.getUserProgress(userId, childId)
          totalProgress += progress
          progressCount++
        } else {
          // Recursively calculate progress for organisational content
          const childProgress = await this.calculateOrganisationalProgress(
            childId,
            userId,
            allContent,
            relationships
          )
          totalProgress += childProgress
          progressCount++
        }
      }

      return progressCount > 0 ? Math.round(totalProgress / progressCount) : 0
    } catch (error) {
      console.error('Error calculating organisational progress:', error)
      return 0
    }
  }

  /**
   * Get progress summary for user
   */
  async getProgressSummary(userId: string): Promise<{
    totalContent: number
    completedContent: number
    totalUniverses: number
    completedUniverses: number
  }> {
    try {
      const { db } = await import('@/lib/db')
      const { userProgress, content } = await import('@/lib/db/schema')

      // Get total content progress entries for user
      const [totalContentResult] = await db
        .select({ count: count() })
        .from(userProgress)
        .where(eq(userProgress.userId, userId))

      // Get completed content (100% progress)
      const [completedContentResult] = await db
        .select({ count: count() })
        .from(userProgress)
        .where(
          and(eq(userProgress.userId, userId), eq(userProgress.progress, 100))
        )

      // Get unique universes the user has progress in
      const uniqueUniverses = await db
        .selectDistinct({ universeId: userProgress.universeId })
        .from(userProgress)
        .where(eq(userProgress.userId, userId))

      // Calculate completed universes
      let completedUniverses = 0
      for (const { universeId } of uniqueUniverses) {
        // Get all viewable content IDs in this universe
        const viewableContent = await db
          .select({ id: content.id })
          .from(content)
          .where(
            and(
              eq(content.universeId, universeId),
              eq(content.isViewable, true)
            )
          )

        const viewableContentIds = viewableContent.map(c => c.id)
        
        if (viewableContentIds.length === 0) {
          continue // Skip universes with no viewable content
        }

        // Get count of completed viewable content by user in this universe
        // We need to check user progress for each viewable content item
        let completedCount = 0
        for (const contentId of viewableContentIds) {
          const progress = await this.getUserProgress(userId, contentId)
          if (progress === 100) {
            completedCount++
          }
        }

        // Universe is completed if user has 100% progress on all viewable content
        if (completedCount === viewableContentIds.length) {
          completedUniverses++
        }
      }

      const totalContent = totalContentResult?.count || 0
      const completedContent = completedContentResult?.count || 0
      const totalUniverses = uniqueUniverses.length

      return {
        totalContent,
        completedContent,
        totalUniverses,
        completedUniverses,
      }
    } catch (error) {
      console.error('Error getting progress summary:', error)
      return {
        totalContent: 0,
        completedContent: 0,
        totalUniverses: 0,
        completedUniverses: 0,
      }
    }
  }

  /**
   * Delete all progress for a content item (when content is deleted)
   */
  async deleteProgressForContent(contentId: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      await db.delete(userProgress).where(eq(userProgress.contentId, contentId))
    } catch (error) {
      console.error('Error deleting progress for content:', error)
      throw new Error('Failed to delete progress for content')
    }
  }

  /**
   * Delete all progress for a universe (when universe is deleted)
   */
  async deleteProgressForUniverse(universeId: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      await db
        .delete(userProgress)
        .where(eq(userProgress.universeId, universeId))
    } catch (error) {
      console.error('Error deleting progress for universe:', error)
      throw new Error('Failed to delete progress for universe')
    }
  }

  /**
   * Get recent progress updates for user
   */
  async getRecentProgress(
    userId: string,
    limit: number = 10
  ): Promise<UserProgress[]> {
    try {
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      const recentProgress = await db
        .select()
        .from(userProgress)
        .where(eq(userProgress.userId, userId))
        .orderBy(sql`${userProgress.updatedAt} DESC`)
        .limit(limit)

      return recentProgress
    } catch (error) {
      console.error('Error fetching recent progress:', error)
      return []
    }
  }

  /**
   * Get content progress statistics for a universe
   */
  async getUniverseProgressStats(universeId: string): Promise<{
    totalViewableContent: number
    usersWithProgress: number
    averageCompletion: number
  }> {
    try {
      const { db } = await import('@/lib/db')
      const { content, userProgress } = await import('@/lib/db/schema')

      // Get total viewable content in universe
      const [totalViewableResult] = await db
        .select({ count: count() })
        .from(content)
        .where(
          and(eq(content.universeId, universeId), eq(content.isViewable, true))
        )

      // Get unique users with progress in this universe
      const uniqueUsers = await db
        .selectDistinct({ userId: userProgress.userId })
        .from(userProgress)
        .where(eq(userProgress.universeId, universeId))

      // Get average completion percentage
      const [avgCompletionResult] = await db
        .select({
          avgProgress: sql<number>`AVG(${userProgress.progress})`,
        })
        .from(userProgress)
        .where(eq(userProgress.universeId, universeId))

      const totalViewableContent = totalViewableResult?.count || 0
      const usersWithProgress = uniqueUsers.length
      const averageCompletion = Math.round(
        Number(avgCompletionResult?.avgProgress) || 0
      )

      return {
        totalViewableContent,
        usersWithProgress,
        averageCompletion,
      }
    } catch (error) {
      console.error('Error getting universe progress stats:', error)
      return {
        totalViewableContent: 0,
        usersWithProgress: 0,
        averageCompletion: 0,
      }
    }
  }

  /**
   * Get all user progress (for store initialization)
   */
  async getAllUserProgress(userId: string): Promise<Record<string, number>> {
    try {
      const { db } = await import('@/lib/db')
      const { userProgress } = await import('@/lib/db/schema')

      const progressData = await db
        .select({
          contentId: userProgress.contentId,
          progress: userProgress.progress,
        })
        .from(userProgress)
        .where(eq(userProgress.userId, userId))

      const progressMap: Record<string, number> = {}

      progressData.forEach(item => {
        progressMap[item.contentId] = item.progress || 0
      })

      return progressMap
    } catch (error) {
      console.error('Error fetching all user progress:', error)
      return {}
    }
  }

  /**
   * Bulk update progress for multiple content items
   */
  async bulkUpdateProgress(
    userId: string,
    progressUpdates: Array<{
      contentId: string
      universeId: string
      progress: number
    }>
  ): Promise<void> {
    try {
      for (const update of progressUpdates) {
        await this.setUserProgress(userId, update)
      }
    } catch (error) {
      console.error('Error bulk updating progress:', error)
      throw new Error('Failed to bulk update progress')
    }
  }
}

export const progressService = new ProgressService()
