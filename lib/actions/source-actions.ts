'use server'

import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-helpers'
import { sourceService } from '@/lib/services'

export interface SourceActionResult {
  success?: boolean
  error?: string
  source?: {
    id: string
    name: string
    backgroundColor: string
    textColor: string
    universeId: string
    userId: string
    createdAt: Date
  }
}

/**
 * Create a new source
 */
export async function createSourceAction(
  universeId: string,
  name: string,
  backgroundColor: string,
  textColor: string
): Promise<SourceActionResult> {
  try {
    // Get current user
    const user = await getCurrentUser()
    if (!user?.id) {
      return {
        error: 'You must be logged in to create sources',
      }
    }

    // Validate input
    if (!name.trim()) {
      return {
        error: 'Source name is required',
      }
    }

    if (!universeId) {
      return {
        error: 'Universe ID is required',
      }
    }

    if (!backgroundColor.match(/^#[0-9A-F]{6}$/i)) {
      return {
        error: 'Invalid background color format',
      }
    }

    if (!textColor.match(/^#[0-9A-F]{6}$/i)) {
      return {
        error: 'Invalid text color format',
      }
    }

    // Create source
    const source = await sourceService.create({
      name: name.trim(),
      backgroundColor,
      textColor,
      universeId,
      userId: user.id,
    })

    // Revalidate paths
    revalidatePath(`/universes/${universeId}`)
    revalidatePath(`/universes/${universeId}/content/add-viewable`)

    return {
      success: true,
      source,
    }
  } catch (error) {
    console.error('Error in createSourceAction:', error)
    return {
      error: 'Failed to create source. Please try again.',
    }
  }
}
