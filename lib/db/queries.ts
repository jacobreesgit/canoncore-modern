import 'server-only'

import { db } from '@/lib/db'
import {
  universes,
  content,
  userProgress,
  users,
  favorites,
} from '@/lib/db/schema'
import { eq, and, desc, count, sql, ilike, or, inArray } from 'drizzle-orm'

/**
 * Database Queries for Neon Serverless PostgreSQL
 *
 * This module contains database queries with fresh data on every request:
 *
 * - Direct database queries without caching
 * - Batch operations to reduce N+1 query patterns
 * - Optimized joins to fetch related data in single queries
 * - Database-level optimizations leveraging PostgreSQL features
 */

export class DatabaseQueries {
  /**
   * Universe queries - no caching for fresh data
   */
  static async getUniverseById(
    id: string
  ): Promise<typeof universes.$inferSelect | null> {
    const result = await db
      .select()
      .from(universes)
      .where(eq(universes.id, id))
      .limit(1)

    return result[0] || null
  }

  static async getUniversesByUserId(userId: string) {
    const result = await db
      .select()
      .from(universes)
      .where(eq(universes.userId, userId))
      .orderBy(desc(universes.createdAt))

    return result
  }

  static async getPublicUniverses(
    options: {
      searchQuery?: string
      sortBy?: 'newest' | 'oldest' | 'name'
      limit?: number
      offset?: number
    } = {}
  ) {
    const { searchQuery, sortBy = 'newest', limit, offset } = options

    // Build where conditions
    const whereConditions = [eq(universes.isPublic, true)]
    if (searchQuery) {
      whereConditions.push(
        or(
          ilike(universes.name, `%${searchQuery}%`),
          ilike(universes.description, `%${searchQuery}%`)
        )!
      )
    }

    // Build order by
    let orderBy
    switch (sortBy) {
      case 'oldest':
        orderBy = universes.createdAt
        break
      case 'name':
        orderBy = universes.name
        break
      default: // 'newest'
        orderBy = desc(universes.createdAt)
    }

    // Build final query
    const query = db
      .select()
      .from(universes)
      .where(and(...whereConditions))
      .orderBy(orderBy)

    // Apply pagination
    if (limit && offset) {
      return query.limit(limit).offset(offset)
    } else if (limit) {
      return query.limit(limit)
    } else if (offset) {
      return query.offset(offset)
    }

    return await query
  }

  /**
   * Content queries - no caching for fresh data
   */
  static async getContentById(id: string) {
    const result = await db
      .select()
      .from(content)
      .where(eq(content.id, id))
      .limit(1)

    return result[0] || null
  }

  static async getContentByUniverse(universeId: string) {
    return await db
      .select()
      .from(content)
      .where(eq(content.universeId, universeId))
      .orderBy(desc(content.createdAt))
  }

  static async getContentWithProgress(
    universeId: string,
    userId: string
  ): Promise<
    Array<{
      id: string
      name: string
      description: string
      universeId: string
      userId: string
      isViewable: boolean
      mediaType: string | null
      createdAt: Date
      updatedAt: Date
      isCompleted?: boolean
    }>
  > {
    const result = await db
      .select({
        id: content.id,
        name: content.name,
        description: content.description,
        universeId: content.universeId,
        userId: content.userId,
        isViewable: content.isViewable,
        mediaType: content.mediaType,
        createdAt: content.createdAt,
        updatedAt: content.updatedAt,
        isCompleted: sql<boolean>`${userProgress.progress} >= 100`,
      })
      .from(content)
      .leftJoin(
        userProgress,
        and(
          eq(userProgress.contentId, content.id),
          eq(userProgress.userId, userId)
        )
      )
      .where(eq(content.universeId, universeId))
      .orderBy(desc(content.createdAt))

    return result
  }

  /**
   * User queries - no caching for fresh data
   */
  static async getUserById(
    id: string
  ): Promise<typeof users.$inferSelect | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return result[0] || null
  }

  static async getUserByEmail(
    email: string
  ): Promise<typeof users.$inferSelect | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return result[0] || null
  }

  static async getUserProfileStats(userId: string) {
    // Get total universes count
    const universesCountResult = await db
      .select({ count: count() })
      .from(universes)
      .where(eq(universes.userId, userId))

    // Get public universes count
    const publicUniversesCountResult = await db
      .select({ count: count() })
      .from(universes)
      .where(and(eq(universes.userId, userId), eq(universes.isPublic, true)))

    // Get favorites count
    const favoritesCountResult = await db
      .select({ count: count() })
      .from(favorites)
      .where(eq(favorites.userId, userId))

    return {
      totalUniverses: universesCountResult[0]?.count || 0,
      publicUniverses: publicUniversesCountResult[0]?.count || 0,
      totalFavorites: favoritesCountResult[0]?.count || 0,
    }
  }

  /**
   * Favorites queries - no caching for fresh data
   */
  static async getUserFavorites(userId: string) {
    const result = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))

    const universeIds: string[] = []
    const contentIds: string[] = []

    result.forEach(fav => {
      if (fav.targetType === 'universe') {
        universeIds.push(fav.targetId)
      } else if (fav.targetType === 'content') {
        contentIds.push(fav.targetId)
      }
    })

    return {
      universes: universeIds,
      content: contentIds,
    }
  }

  static async isFavorite(
    userId: string,
    targetId: string,
    targetType: 'universe' | 'content'
  ): Promise<boolean> {
    const result = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, userId),
          eq(favorites.targetId, targetId),
          eq(favorites.targetType, targetType)
        )
      )
      .limit(1)

    return result.length > 0
  }

  /**
   * Progress queries - no caching for fresh data
   */
  static async getUserProgress(userId: string, contentId: string) {
    const result = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.contentId, contentId)
        )
      )
      .limit(1)

    return result[0] || null
  }

  static async getUniverseProgress(userId: string, universeId: string) {
    const result = await db
      .select({
        totalContent: count(content.id),
        completedContent:
          sql<number>`sum(case when ${userProgress.progress} >= 100 then 1 else 0 end)`.as(
            'completedContent'
          ),
      })
      .from(content)
      .leftJoin(
        userProgress,
        and(
          eq(userProgress.contentId, content.id),
          eq(userProgress.userId, userId)
        )
      )
      .where(eq(content.universeId, universeId))

    const stats = result[0]
    return {
      totalContent: stats?.totalContent || 0,
      completedContent: Number(stats?.completedContent) || 0,
    }
  }

  /**
   * Batch operations for performance
   */
  static async getMultipleUniversesByIds(ids: string[]) {
    if (ids.length === 0) return []

    return await db.select().from(universes).where(inArray(universes.id, ids))
  }

  static async getMultipleContentByIds(ids: string[]) {
    if (ids.length === 0) return []

    return await db.select().from(content).where(inArray(content.id, ids))
  }

  static async getMultipleUsersByIds(ids: string[]) {
    if (ids.length === 0) return []

    return await db.select().from(users).where(inArray(users.id, ids))
  }
}
