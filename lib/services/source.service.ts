import 'server-only'

import { eq, and, asc } from 'drizzle-orm'
import type { Source } from '@/lib/db/schema'

/**
 * Server-side Source Service
 *
 * Provides server-side data access for Source operations:
 * - Direct PostgreSQL access with Drizzle ORM
 * - Server-side data fetching for Server Components
 * - Enhanced security with server-only access
 * - Better performance with optimized queries
 */

export class SourceService {
  /**
   * Get all sources for a universe
   */
  async getByUniverse(universeId: string, userId: string): Promise<Source[]> {
    try {
      const { db } = await import('@/lib/db')
      const { sources } = await import('@/lib/db/schema')

      const universeSources = await db
        .select()
        .from(sources)
        .where(
          and(eq(sources.universeId, universeId), eq(sources.userId, userId))
        )
        .orderBy(asc(sources.name))

      return universeSources
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching sources for universe:', error)
      }
      throw new Error('Failed to fetch sources for universe')
    }
  }

  /**
   * Create new source
   */
  async create(data: {
    name: string
    backgroundColor: string
    textColor: string
    universeId: string
    userId: string
  }): Promise<Source> {
    try {
      const { db } = await import('@/lib/db')
      const { sources } = await import('@/lib/db/schema')

      const [newSource] = await db
        .insert(sources)
        .values({
          ...data,
          createdAt: new Date(),
        })
        .returning()

      return newSource
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error creating source:', error)
      }
      throw new Error('Failed to create source')
    }
  }

  /**
   * Update source
   */
  async update(id: string, data: Partial<Source>): Promise<Source | null> {
    try {
      const { db } = await import('@/lib/db')
      const { sources } = await import('@/lib/db/schema')

      const [updatedSource] = await db
        .update(sources)
        .set(data)
        .where(eq(sources.id, id))
        .returning()

      return updatedSource || null
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating source:', error)
      }
      throw new Error('Failed to update source')
    }
  }

  /**
   * Delete source
   */
  async delete(id: string, userId: string): Promise<void> {
    try {
      const { db } = await import('@/lib/db')
      const { sources } = await import('@/lib/db/schema')

      await db
        .delete(sources)
        .where(and(eq(sources.id, id), eq(sources.userId, userId)))
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting source:', error)
      }
      throw new Error('Failed to delete source')
    }
  }
}

export const sourceService = new SourceService()
