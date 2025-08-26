'use server'

import { universeService } from '@/lib/services'
import { getCurrentUser } from '@/lib/auth-helpers'

export interface UniverseActionResult {
  success: boolean
  error?: string
  data?: unknown
}

/**
 * Server Actions for Universe CRUD operations
 * Following React 19 server action patterns with modern Next.js 15
 */

export async function createUniverseAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: 'Authentication required' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true'
    const sourceLink = formData.get('sourceLink') as string
    const sourceLinkName = formData.get('sourceLinkName') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Universe name is required' }
    }

    // Basic URL validation if provided
    if (sourceLink && sourceLink.trim()) {
      try {
        new URL(sourceLink.trim())
      } catch {
        return { success: false, error: 'Please enter a valid source URL' }
      }
    }

    const universe = await universeService.create({
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic,
      sourceLink: sourceLink?.trim() || null,
      sourceLinkName: sourceLinkName?.trim() || null,
      userId: user.id,
    })

    // Using dynamic rendering for fresh data

    return {
      success: true,
      universeId: universe.id,
      message: 'Universe created successfully',
    }
  } catch (error) {
    console.error('Error creating universe:', error)
    return {
      success: false,
      error: 'Failed to create universe. Please try again.',
    }
  }
}

export async function updateUniverseAction(
  universeId: string,
  formData: FormData
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user owns the universe
    const existingUniverse = await universeService.getById(universeId)
    if (!existingUniverse || existingUniverse.userId !== user.id) {
      return { success: false, error: 'Permission denied' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isPublic = formData.get('isPublic') === 'true'
    const sourceLink = formData.get('sourceLink') as string
    const sourceLinkName = formData.get('sourceLinkName') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Universe name is required' }
    }

    // Basic URL validation if provided
    if (sourceLink && sourceLink.trim()) {
      try {
        new URL(sourceLink.trim())
      } catch {
        return { success: false, error: 'Please enter a valid source URL' }
      }
    }

    await universeService.update(universeId, {
      name: name.trim(),
      description: description?.trim() || '',
      isPublic: isPublic,
      sourceLink: sourceLink?.trim() || null,
      sourceLinkName: sourceLinkName?.trim() || null,
    })

    // Using dynamic rendering for fresh data

    return {
      success: true,
      message: 'Universe updated successfully',
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating universe:', error)
    }
    return {
      success: false,
      error: 'Failed to update universe. Please try again.',
    }
  }
}

export async function deleteUniverseAction(universeId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user owns the universe
    const existingUniverse = await universeService.getById(universeId)
    if (!existingUniverse || existingUniverse.userId !== user.id) {
      return { success: false, error: 'Permission denied' }
    }

    await universeService.delete(universeId)

    // Using dynamic rendering for fresh data

    return {
      success: true,
      message: 'Universe deleted successfully',
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting universe:', error)
    }
    return {
      success: false,
      error: 'Failed to delete universe. Please try again.',
    }
  }
}
