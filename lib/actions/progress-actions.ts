'use server'

import { auth } from '@/lib/auth'
import { progressService } from '@/lib/services/progress.service'
import { revalidatePath } from 'next/cache'

/**
 * Server Actions for Progress Management
 *
 * Handles server-side mutations for user progress:
 * - Set/update content progress with authentication
 * - Database persistence through ProgressService
 * - Cache revalidation for updated data
 * - Error handling and user feedback
 */

export interface ProgressActionResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Set user progress for content
 */
export async function setContentProgressAction(
  contentId: string,
  universeId: string,
  progress: number
): Promise<ProgressActionResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate progress value
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return {
        success: false,
        error: 'Progress must be a number between 0 and 100',
      }
    }

    const updatedProgress = await progressService.setUserProgress(
      session.user.id,
      {
        contentId,
        universeId,
        progress,
      }
    )

    // Revalidate pages that might display progress
    revalidatePath('/dashboard')
    revalidatePath(`/universes/${universeId}`)
    revalidatePath(`/content/${contentId}`)
    revalidatePath(`/profile/${session.user.id}`)

    return {
      success: true,
      data: updatedProgress,
    }
  } catch (error) {
    console.error('Error setting content progress:', error)
    return {
      success: false,
      error: 'Failed to update progress',
    }
  }
}

/**
 * Get user progress for a universe (for initial load)
 */
export async function getUserProgressByUniverseAction(
  universeId: string
): Promise<{
  success: boolean
  data?: Record<string, number>
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

    const progressMap = await progressService.getUserProgressByUniverse(
      session.user.id,
      universeId
    )

    return {
      success: true,
      data: progressMap,
    }
  } catch (error) {
    console.error('Error fetching universe progress:', error)
    return {
      success: false,
      error: 'Failed to fetch progress',
    }
  }
}

/**
 * Get all user progress (for initial store load)
 */
export async function getAllUserProgressAction(): Promise<{
  success: boolean
  data?: Record<string, number>
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

    const progressMap = await progressService.getAllUserProgress(
      session.user.id
    )

    return {
      success: true,
      data: progressMap,
    }
  } catch (error) {
    console.error('Error fetching all user progress:', error)
    return {
      success: false,
      error: 'Failed to fetch progress',
    }
  }
}

/**
 * Bulk update progress for multiple content items
 */
export async function bulkUpdateProgressAction(
  progressUpdates: Array<{
    contentId: string
    universeId: string
    progress: number
  }>
): Promise<ProgressActionResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Validate all progress values
    for (const update of progressUpdates) {
      if (
        typeof update.progress !== 'number' ||
        update.progress < 0 ||
        update.progress > 100
      ) {
        return {
          success: false,
          error: 'All progress values must be numbers between 0 and 100',
        }
      }
    }

    await progressService.bulkUpdateProgress(session.user.id, progressUpdates)

    // Revalidate relevant pages
    const universeIds = [...new Set(progressUpdates.map(u => u.universeId))]
    revalidatePath('/dashboard')
    revalidatePath(`/profile/${session.user.id}`)

    universeIds.forEach(universeId => {
      revalidatePath(`/universes/${universeId}`)
    })

    return {
      success: true,
    }
  } catch (error) {
    console.error('Error bulk updating progress:', error)
    return {
      success: false,
      error: 'Failed to update progress',
    }
  }
}

/**
 * Get progress summary for user dashboard
 */
export async function getProgressSummaryAction(): Promise<{
  success: boolean
  data?: {
    totalContent: number
    completedContent: number
    totalUniverses: number
    completedUniverses: number
  }
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

    const summary = await progressService.getProgressSummary(session.user.id)

    return {
      success: true,
      data: summary,
    }
  } catch (error) {
    console.error('Error fetching progress summary:', error)
    return {
      success: false,
      error: 'Failed to fetch progress summary',
    }
  }
}
