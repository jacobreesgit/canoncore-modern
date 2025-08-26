'use server'

import { auth } from '@/lib/auth'
import { userService } from '@/lib/services/user.service'
import { universeService } from '@/lib/services/universe.service'
import { contentService } from '@/lib/services/content.service'
import type { Universe, Content } from '@/lib/types'

/**
 * Server Actions for Favourites Management
 *
 * Handles server-side mutations for user favourites:
 * - Add/remove favourites with authentication
 * - Database persistence through UserService
 * - Fresh data on every request
 * - Error handling and user feedback
 */

export interface FavouriteActionResult {
  success: boolean
  error?: string
}

/**
 * Toggle favourite status for a target (universe or content)
 */
export async function toggleFavouriteAction(
  targetId: string,
  targetType: 'universe' | 'content'
): Promise<FavouriteActionResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Check current favourite status
    const isCurrentlyFavourite = await userService.isFavourite(
      session.user.id,
      targetId,
      targetType
    )

    if (isCurrentlyFavourite) {
      // Remove from favourites
      await userService.removeFromFavourites(
        session.user.id,
        targetId,
        targetType
      )
    } else {
      // Add to favourites
      await userService.addToFavourites(session.user.id, targetId, targetType)
    }

    // Using dynamic rendering for fresh data

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error toggling favourite:', error)
    return {
      success: false,
      error: 'Failed to update favourite status',
    }
  }
}

/**
 * Get user favourites (for initial load)
 */
export async function getUserFavouritesAction(): Promise<{
  success: boolean
  data?: { universes: string[]; content: string[] }
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const favourites = await userService.getUserFavourites(session.user.id)

    return {
      success: true,
      data: favourites,
    }
  } catch (error) {
    console.error('Error fetching user favourites:', error)
    return {
      success: false,
      error: 'Failed to fetch favourites',
    }
  }
}

interface FavoriteUniverse extends Universe {
  isFavorite: boolean
}

interface FavoriteContent extends Content {
  isFavorite: boolean
  universeName?: string
}

/**
 * Get favorite universes with full data
 */
export async function getFavoriteUniversesAction(): Promise<{
  success: boolean
  data?: FavoriteUniverse[]
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const favourites = await userService.getUserFavourites(session.user.id)
    const universes = await Promise.all(
      favourites.universes.map(async id => {
        try {
          const universe = await universeService.getById(id)
          return universe ? { ...universe, isFavorite: true } : null
        } catch (error) {
          console.error(`Error loading universe ${id}:`, error)
          return null
        }
      })
    )

    return {
      success: true,
      data: universes.filter(Boolean) as FavoriteUniverse[],
    }
  } catch (error) {
    console.error('Error fetching favorite universes:', error)
    return {
      success: false,
      error: 'Failed to fetch favorite universes',
    }
  }
}

/**
 * Get favorite content with full data including universe names
 */
export async function getFavoriteContentAction(): Promise<{
  success: boolean
  data?: FavoriteContent[]
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const favourites = await userService.getUserFavourites(session.user.id)
    const content = await Promise.all(
      favourites.content.map(async id => {
        try {
          const contentItem = await contentService.getById(id)
          if (!contentItem) return null

          // Get universe name for display
          const universe = await universeService.getById(contentItem.universeId)

          return {
            ...contentItem,
            isFavorite: true,
            universeName: universe?.name || 'Unknown Universe',
          }
        } catch (error) {
          console.error(`Error loading content ${id}:`, error)
          return null
        }
      })
    )

    return {
      success: true,
      data: content.filter(Boolean) as FavoriteContent[],
    }
  } catch (error) {
    console.error('Error fetching favorite content:', error)
    return {
      success: false,
      error: 'Failed to fetch favorite content',
    }
  }
}
