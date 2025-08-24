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
 * Optimized Database Queries for Neon Serverless PostgreSQL
 *
 * This module contains optimized database queries designed specifically for Neon's
 * serverless PostgreSQL architecture. Instead of prepared statements (which have
 * limitations in HTTP-based serverless environments), we use:
 *
 * - Intelligent query result caching with TTL-based invalidation
 * - Batch operations to reduce N+1 query patterns
 * - Optimized joins to fetch related data in single queries
 * - Database-level optimizations leveraging PostgreSQL features
 */

interface CacheEntry<T> {
  result: T
  timestamp: number
  ttl: number
}

export class OptimizedQueries {
  private static queryCache = new Map<string, CacheEntry<unknown>>()

  // Cache TTL constants (in milliseconds)
  private static readonly CACHE_TTL = {
    SHORT: 2 * 60 * 1000, // 2 minutes - for frequently changing data
    MEDIUM: 5 * 60 * 1000, // 5 minutes - for moderately changing data
    LONG: 15 * 60 * 1000, // 15 minutes - for rarely changing data
  } as const

  /**
   * Generic cache management methods
   */
  private static getCachedResult<T>(key: string): T | null {
    const cached = OptimizedQueries.queryCache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.result as T
    }
    return null
  }

  private static setCachedResult<T>(key: string, result: T, ttl: number): void {
    OptimizedQueries.queryCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl,
    })
  }

  private static invalidateCache(pattern?: string): void {
    if (!pattern) {
      OptimizedQueries.queryCache.clear()
      return
    }

    for (const key of OptimizedQueries.queryCache.keys()) {
      if (key.includes(pattern)) {
        OptimizedQueries.queryCache.delete(key)
      }
    }
  }

  /**
   * Universe queries with intelligent caching
   */
  static async getUniverseById(
    id: string
  ): Promise<typeof universes.$inferSelect | null> {
    const cacheKey = `universe:${id}`
    const cached = OptimizedQueries.getCachedResult<
      typeof universes.$inferSelect | null
    >(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(universes)
      .where(eq(universes.id, id))
      .limit(1)

    const universe = result[0] || null
    OptimizedQueries.setCachedResult(
      cacheKey,
      universe,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return universe
  }

  static async getPublicUniverses(
    limit: number = 20
  ): Promise<(typeof universes.$inferSelect)[]> {
    const cacheKey = `public_universes:${limit}`
    const cached =
      OptimizedQueries.getCachedResult<(typeof universes.$inferSelect)[]>(
        cacheKey
      )
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(universes)
      .where(eq(universes.isPublic, true))
      .orderBy(desc(universes.createdAt))
      .limit(limit)

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.SHORT
    )
    return result
  }

  static async getUniversesByUser(
    userId: string
  ): Promise<(typeof universes.$inferSelect)[]> {
    const cacheKey = `user_universes:${userId}`
    const cached =
      OptimizedQueries.getCachedResult<(typeof universes.$inferSelect)[]>(
        cacheKey
      )
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(universes)
      .where(eq(universes.userId, userId))
      .orderBy(desc(universes.createdAt))

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return result
  }

  /**
   * Content queries with optimized joins and caching
   */
  static async getContentById(id: string) {
    const cacheKey = `content:${id}`
    const cached = OptimizedQueries.getCachedResult<unknown>(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(content)
      .where(eq(content.id, id))
      .limit(1)

    const contentItem = result[0] || null
    OptimizedQueries.setCachedResult(
      cacheKey,
      contentItem,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return contentItem
  }

  static async getContentByUniverse(universeId: string) {
    const cacheKey = `universe_content:${universeId}`
    const cached = OptimizedQueries.getCachedResult<unknown[]>(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(content)
      .where(eq(content.universeId, universeId))
      .orderBy(content.createdAt)

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return result
  }

  /**
   * User progress queries with optimized joins
   */
  static async getUserProgress(userId: string, contentId: string) {
    const cacheKey = `user_progress:${userId}:${contentId}`
    const cached = OptimizedQueries.getCachedResult<unknown>(cacheKey)
    if (cached !== null) return cached

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

    const progress = result[0] || null
    OptimizedQueries.setCachedResult(
      cacheKey,
      progress,
      OptimizedQueries.CACHE_TTL.SHORT
    )
    return progress
  }

  static async getUserProgressByUniverse(userId: string, universeId: string) {
    const cacheKey = `user_universe_progress:${userId}:${universeId}`
    const cached = OptimizedQueries.getCachedResult<unknown[]>(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select({
        id: userProgress.id,
        userId: userProgress.userId,
        contentId: userProgress.contentId,
        progress: userProgress.progress,
        lastAccessedAt: userProgress.lastAccessedAt,
        updatedAt: userProgress.updatedAt,
        contentTitle: content.name,
        contentType: content.mediaType,
      })
      .from(userProgress)
      .innerJoin(content, eq(userProgress.contentId, content.id))
      .where(
        and(eq(userProgress.userId, userId), eq(content.universeId, universeId))
      )

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.SHORT
    )
    return result
  }

  /**
   * User queries with caching
   */
  static async getUserById(
    id: string
  ): Promise<typeof users.$inferSelect | null> {
    const cacheKey = `user:${id}`
    const cached = OptimizedQueries.getCachedResult<
      typeof users.$inferSelect | null
    >(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    const user = result[0] || null
    OptimizedQueries.setCachedResult(
      cacheKey,
      user,
      OptimizedQueries.CACHE_TTL.LONG
    )
    return user
  }

  static async getUserByEmail(
    email: string
  ): Promise<typeof users.$inferSelect | null> {
    const cacheKey = `user_email:${email}`
    const cached = OptimizedQueries.getCachedResult<
      typeof users.$inferSelect | null
    >(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const user = result[0] || null
    OptimizedQueries.setCachedResult(
      cacheKey,
      user,
      OptimizedQueries.CACHE_TTL.LONG
    )
    return user
  }

  /**
   * Favourites queries with caching
   */
  static async getUserFavourites(
    userId: string
  ): Promise<(typeof favorites.$inferSelect)[]> {
    const cacheKey = `user_favourites:${userId}`
    const cached =
      OptimizedQueries.getCachedResult<(typeof favorites.$inferSelect)[]>(
        cacheKey
      )
    if (cached !== null) return cached

    const result = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId))

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return result
  }

  /**
   * Batch operations for reducing N+1 queries
   */
  static async getBatchUniverses(ids: string[]) {
    if (ids.length === 0) return []

    // Use PostgreSQL array operations for efficiency
    return await db.select().from(universes).where(inArray(universes.id, ids))
  }

  static async getBatchContent(ids: string[]) {
    if (ids.length === 0) return []

    return await db.select().from(content).where(inArray(content.id, ids))
  }

  static async getBatchUsers(ids: string[]) {
    if (ids.length === 0) return []

    return await db.select().from(users).where(inArray(users.id, ids))
  }

  /**
   * Optimized joins to fetch related data in single queries
   */
  static async getUniversesWithContentCounts(userId: string) {
    const cacheKey = `user_universes_with_counts:${userId}`
    const cached = OptimizedQueries.getCachedResult<unknown[]>(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select({
        id: universes.id,
        name: universes.name,
        description: universes.description,
        isPublic: universes.isPublic,
        createdAt: universes.createdAt,
        updatedAt: universes.updatedAt,
        contentCount: count(content.id),
      })
      .from(universes)
      .leftJoin(content, eq(content.universeId, universes.id))
      .where(eq(universes.userId, userId))
      .groupBy(
        universes.id,
        universes.name,
        universes.description,
        universes.isPublic,
        universes.createdAt,
        universes.updatedAt
      )
      .orderBy(desc(universes.createdAt))

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return result
  }

  static async getUniverseWithProgressStats(
    universeId: string,
    userId: string
  ) {
    const cacheKey = `universe_progress_stats:${universeId}:${userId}`
    const cached = OptimizedQueries.getCachedResult<unknown>(cacheKey)
    if (cached !== null) return cached

    const [universeResult, progressResult] = await Promise.all([
      db.select().from(universes).where(eq(universes.id, universeId)).limit(1),

      db
        .select({
          totalContent: count(content.id),
          completedContent: sql<number>`COUNT(CASE WHEN ${userProgress.progress} = 100 THEN 1 END)`,
          averageProgress: sql<number>`AVG(COALESCE(${userProgress.progress}, 0))`,
        })
        .from(content)
        .leftJoin(
          userProgress,
          and(
            eq(userProgress.contentId, content.id),
            eq(userProgress.userId, userId)
          )
        )
        .where(eq(content.universeId, universeId)),
    ])

    const result = {
      universe: universeResult[0] || null,
      stats: progressResult[0] || {
        totalContent: 0,
        completedContent: 0,
        averageProgress: 0,
      },
    }

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.SHORT
    )
    return result
  }

  /**
   * Search optimized queries with full-text search
   */
  static async searchUniverses(
    searchQuery: string,
    limit: number = 20
  ): Promise<(typeof universes.$inferSelect)[]> {
    if (!searchQuery.trim()) {
      return await OptimizedQueries.getPublicUniverses(limit)
    }

    const cacheKey = `search_universes:${searchQuery}:${limit}`
    const cached =
      OptimizedQueries.getCachedResult<(typeof universes.$inferSelect)[]>(
        cacheKey
      )
    if (cached !== null) return cached

    const searchTerm = `%${searchQuery.trim()}%`
    const result = await db
      .select()
      .from(universes)
      .where(
        and(
          eq(universes.isPublic, true),
          or(
            ilike(universes.name, searchTerm),
            ilike(universes.description, searchTerm)
          )
        )
      )
      .orderBy(desc(universes.createdAt))
      .limit(limit)

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.SHORT
    )
    return result
  }

  /**
   * Analytics and performance queries
   */
  static async getUniverseContentCount(universeId: string) {
    const cacheKey = `universe_content_count:${universeId}`
    const cached = OptimizedQueries.getCachedResult<number>(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select({ count: count() })
      .from(content)
      .where(eq(content.universeId, universeId))

    const contentCount = result[0]?.count || 0
    OptimizedQueries.setCachedResult(
      cacheKey,
      contentCount,
      OptimizedQueries.CACHE_TTL.MEDIUM
    )
    return contentCount
  }

  static async getUserProgressStats(userId: string) {
    const cacheKey = `user_progress_stats:${userId}`
    const cached = OptimizedQueries.getCachedResult<unknown[]>(cacheKey)
    if (cached !== null) return cached

    const result = await db
      .select({
        universeId: content.universeId,
        universeName: universes.name,
        totalContent: count(content.id),
        completedContent: sql<number>`COUNT(CASE WHEN ${userProgress.progress} = 100 THEN 1 END)`,
        averageProgress: sql<number>`AVG(COALESCE(${userProgress.progress}, 0))`,
      })
      .from(content)
      .innerJoin(universes, eq(content.universeId, universes.id))
      .leftJoin(
        userProgress,
        and(
          eq(userProgress.contentId, content.id),
          eq(userProgress.userId, userId)
        )
      )
      .groupBy(content.universeId, universes.name)
      .orderBy(desc(sql`AVG(COALESCE(${userProgress.progress}, 0))`))

    OptimizedQueries.setCachedResult(
      cacheKey,
      result,
      OptimizedQueries.CACHE_TTL.SHORT
    )
    return result
  }

  /**
   * Cache management and maintenance methods
   */
  static invalidateUserCache(userId: string): void {
    OptimizedQueries.invalidateCache(`user:${userId}`)
    OptimizedQueries.invalidateCache(`user_universes:${userId}`)
    OptimizedQueries.invalidateCache(`user_favourites:${userId}`)
    OptimizedQueries.invalidateCache(`user_progress:${userId}`)
    OptimizedQueries.invalidateCache(`user_universe_progress:${userId}`)
    OptimizedQueries.invalidateCache(`user_progress_stats:${userId}`)
    OptimizedQueries.invalidateCache(`user_universes_with_counts:${userId}`)
  }

  static invalidateUniverseCache(universeId: string): void {
    OptimizedQueries.invalidateCache(`universe:${universeId}`)
    OptimizedQueries.invalidateCache(`universe_content:${universeId}`)
    OptimizedQueries.invalidateCache(`universe_content_count:${universeId}`)
    OptimizedQueries.invalidateCache(`universe_progress_stats:${universeId}`)
    OptimizedQueries.invalidateCache('public_universes')
    OptimizedQueries.invalidateCache('search_universes')
  }

  static invalidateContentCache(contentId: string, universeId?: string): void {
    OptimizedQueries.invalidateCache(`content:${contentId}`)
    if (universeId) {
      OptimizedQueries.invalidateCache(`universe_content:${universeId}`)
      OptimizedQueries.invalidateCache(`universe_content_count:${universeId}`)
    }
  }

  static clearAllCaches(): void {
    OptimizedQueries.queryCache.clear()
  }

  /**
   * Performance monitoring
   */
  static getCacheStats() {
    return {
      totalCacheEntries: OptimizedQueries.queryCache.size,
      cacheKeys: Array.from(OptimizedQueries.queryCache.keys()),
      memoryUsage: JSON.stringify([...OptimizedQueries.queryCache.entries()])
        .length,
    }
  }

  /**
   * Cache warming for frequently accessed data
   */
  static async warmCache() {
    try {
      await Promise.all([
        OptimizedQueries.getPublicUniverses(10),
        // Add other frequently accessed queries here as needed
      ])
    } catch (error) {
      console.warn('Cache warming failed:', error)
    }
  }
}
