'use server'

import { contentService, relationshipService } from '@/lib/services'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-helpers'

/**
 * Server Actions for Content CRUD operations
 * Following React 19 server action patterns
 */

export interface ContentActionResult {
  success: boolean
  error?: string
  data?: unknown
}

export async function createContentAction(formData: FormData) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: 'Authentication required' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const universeId = formData.get('universeId') as string
    const isViewable = formData.get('isViewable') === 'true'
    const mediaType = formData.get('mediaType') as string
    const parentId = formData.get('parentId') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Content name is required' }
    }

    if (!universeId) {
      return { success: false, error: 'Universe ID is required' }
    }

    // Validate media type for viewable content
    if (isViewable && !mediaType) {
      return {
        success: false,
        error: 'Media type is required for viewable content',
      }
    }

    const contentData = {
      name: name.trim(),
      description: description?.trim() || '',
      universeId,
      userId: user.id,
      isViewable,
      mediaType: isViewable ? mediaType : '',
    }

    const newContent = await contentService.create(contentData)

    // Create relationship if parent is specified
    if (parentId && parentId.trim()) {
      await relationshipService.create(
        parentId.trim(),
        newContent.id,
        universeId,
        user.id
      )
    }

    // Revalidate relevant paths
    revalidatePath(`/universes/${universeId}`)

    return {
      success: true,
      contentId: newContent.id,
      message: 'Content created successfully',
    }
  } catch (error) {
    console.error('Error creating content:', error)
    return {
      success: false,
      error: 'Failed to create content. Please try again.',
    }
  }
}

export async function updateContentAction(
  contentId: string,
  formData: FormData
) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user owns the content
    const existingContent = await contentService.getById(contentId)
    if (!existingContent || existingContent.userId !== user.id) {
      return { success: false, error: 'Permission denied' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const mediaType = formData.get('mediaType') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Content name is required' }
    }

    // Validate media type for viewable content
    if (existingContent.isViewable && !mediaType) {
      return {
        success: false,
        error: 'Media type is required for viewable content',
      }
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      ...(existingContent.isViewable && { mediaType }),
    }

    await contentService.update(contentId, updateData)

    // Revalidate relevant paths
    revalidatePath(`/universes/${existingContent.universeId}`)
    revalidatePath(`/content/${contentId}`)

    return {
      success: true,
      message: 'Content updated successfully',
    }
  } catch (error) {
    console.error('Error updating content:', error)
    return {
      success: false,
      error: 'Failed to update content. Please try again.',
    }
  }
}

export async function deleteContentAction(contentId: string) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.id) {
      return { success: false, error: 'Authentication required' }
    }

    // Check if user owns the content
    const existingContent = await contentService.getById(contentId)
    if (!existingContent || existingContent.userId !== user.id) {
      return { success: false, error: 'Permission denied' }
    }

    // Delete relationships first
    await relationshipService.deleteAllForContent(contentId)

    // Delete the content
    await contentService.delete(contentId)

    // Revalidate relevant paths
    revalidatePath(`/universes/${existingContent.universeId}`)

    return {
      success: true,
      message: 'Content deleted successfully',
    }
  } catch (error) {
    console.error('Error deleting content:', error)
    return {
      success: false,
      error: 'Failed to delete content. Please try again.',
    }
  }
}
