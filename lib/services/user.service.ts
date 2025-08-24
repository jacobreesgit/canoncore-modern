import 'server-only'

import { db } from '@/lib/db'
import { users, favorites, universes } from '@/lib/db/schema'
import { eq, and, count } from 'drizzle-orm'
import type { User, NewUser, Favorite } from '@/lib/db/schema'
import { OptimizedQueries } from '@/lib/db/optimized-queries'
import { withPerformanceMonitoring } from '@/lib/db/connection-pool'

/**
 * Server-side User Service
 *
 * Provides server-side data access for User operations:
 * - Direct PostgreSQL access with Drizzle ORM
 * - Server-side data fetching for Server Components
 * - Enhanced security with server-only access
 * - Better performance with optimized queries
 */

export class UserService {
  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User | null> {
    const optimizedGetById = withPerformanceMonitoring(
      OptimizedQueries.getUserById,
      'user.getById'
    )
    return await optimizedGetById(id)
  }

  /**
   * Create a new user
   */
  async create(userData: NewUser): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          ...userData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      return newUser
    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error('Failed to create user')
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(
    id: string,
    updateData: Partial<NewUser>
  ): Promise<User | null> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning()

      return updatedUser || null
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw new Error('Failed to update user profile')
    }
  }

  /**
   * Get user favourites
   */
  async getUserFavourites(
    userId: string
  ): Promise<{ universes: string[]; content: string[] }> {
    try {
      const optimizedGetFavourites = withPerformanceMonitoring(
        OptimizedQueries.getUserFavourites,
        'user.getUserFavourites'
      )
      const userFavorites = await optimizedGetFavourites(userId)

      const universes: string[] = []
      const content: string[] = []

      userFavorites.forEach(favorite => {
        if (favorite.targetType === 'universe') {
          universes.push(favorite.targetId)
        } else if (favorite.targetType === 'content') {
          content.push(favorite.targetId)
        }
      })

      return { universes, content }
    } catch (error) {
      console.error('Error fetching user favourites:', error)
      return { universes: [], content: [] }
    }
  }

  /**
   * Add to favourites
   */
  async addToFavourites(
    userId: string,
    targetId: string,
    targetType: 'universe' | 'content'
  ): Promise<Favorite> {
    try {
      const [favorite] = await db
        .insert(favorites)
        .values({
          userId,
          targetId,
          targetType,
          createdAt: new Date(),
        })
        .returning()

      return favorite
    } catch (error) {
      console.error('Error adding to favourites:', error)
      throw new Error('Failed to add to favourites')
    }
  }

  /**
   * Remove from favourites
   */
  async removeFromFavourites(
    userId: string,
    targetId: string,
    targetType: 'universe' | 'content'
  ): Promise<void> {
    try {
      await db
        .delete(favorites)
        .where(
          and(
            eq(favorites.userId, userId),
            eq(favorites.targetId, targetId),
            eq(favorites.targetType, targetType)
          )
        )
    } catch (error) {
      console.error('Error removing from favourites:', error)
      throw new Error('Failed to remove from favourites')
    }
  }

  /**
   * Check if item is favourited by user
   */
  async isFavourite(
    userId: string,
    targetId: string,
    targetType: 'universe' | 'content'
  ): Promise<boolean> {
    try {
      const [favorite] = await db
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

      return !!favorite
    } catch (error) {
      console.error('Error checking favourite status:', error)
      return false
    }
  }

  /**
   * Get user's public universes count
   */
  async getPublicUniversesCount(userId: string): Promise<number> {
    try {
      const result = await db
        .select({ count: universes.id })
        .from(universes)
        .where(and(eq(universes.userId, userId), eq(universes.isPublic, true)))

      return result.length
    } catch (error) {
      console.error('Error fetching public universes count:', error)
      return 0
    }
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    const optimizedGetByEmail = withPerformanceMonitoring(
      OptimizedQueries.getUserByEmail,
      'user.getByEmail'
    )
    return await optimizedGetByEmail(email)
  }

  /**
   * Get user profile statistics
   */
  async getProfileStats(userId: string): Promise<{
    totalUniverses: number
    publicUniverses: number
    favouritesCount: number
  }> {
    try {
      const [universesCount] = await db
        .select({ count: count() })
        .from(universes)
        .where(eq(universes.userId, userId))

      const [publicUniversesCount] = await db
        .select({ count: count() })
        .from(universes)
        .where(and(eq(universes.userId, userId), eq(universes.isPublic, true)))

      const [favouritesCount] = await db
        .select({ count: count() })
        .from(favorites)
        .where(eq(favorites.userId, userId))

      return {
        totalUniverses: universesCount.count,
        publicUniverses: publicUniversesCount.count,
        favouritesCount: favouritesCount.count,
      }
    } catch (error) {
      console.error('Error fetching profile stats:', error)
      return {
        totalUniverses: 0,
        publicUniverses: 0,
        favouritesCount: 0,
      }
    }
  }
}

export const userService = new UserService()
