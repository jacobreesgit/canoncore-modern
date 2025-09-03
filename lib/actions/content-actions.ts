'use server'

import { contentService, relationshipService } from '@/lib/services'
import { redirect } from 'next/navigation'
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
    const itemType = formData.get('itemType') as string
    const parentId = formData.get('parentId') as string
    const sourceId = formData.get('sourceId') as string

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('Content creation debug:', {
        name,
        universeId,
        parentId: parentId || 'NO_PARENT',
        isViewable,
        itemType,
      })
    }

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Content name is required' }
    }

    if (!universeId) {
      return { success: false, error: 'Universe ID is required' }
    }

    // Validate media type for viewable content
    if (isViewable && !itemType) {
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
      itemType: itemType || '',
      sourceId:
        isViewable && sourceId && sourceId.trim() ? sourceId.trim() : null,
    }

    const newContent = await contentService.create(contentData)

    // Create relationship if parent is specified
    if (parentId && parentId.trim()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Creating parent-child relationship:', {
          parentId: parentId.trim(),
          childId: newContent.id,
          universeId,
          userId: user.id,
        })
      }

      try {
        await relationshipService.create(
          parentId.trim(),
          newContent.id,
          universeId,
          user.id
        )

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Relationship created successfully')
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to create relationship:', error)
        }
        // Don't fail the content creation if relationship fails
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log(
          'No parent specified - creating top-level content with null parent'
        )
      }

      try {
        // Create root-level relationship with null parent
        await relationshipService.create(
          null, // parentId is null for root-level content
          newContent.id,
          universeId,
          user.id
        )

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Root-level relationship created successfully')
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Failed to create root-level relationship:', error)
        }
        // Don't fail the content creation if relationship fails
      }
    }

    // Using dynamic rendering for fresh data

    return {
      success: true,
      contentId: newContent.id,
      message: 'Content created successfully',
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error creating content:', error)
    }
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
    const itemType = formData.get('itemType') as string

    if (!name || name.trim().length === 0) {
      return { success: false, error: 'Content name is required' }
    }

    // Validate media type for viewable content
    if (existingContent.isViewable && !itemType) {
      return {
        success: false,
        error: 'Media type is required for viewable content',
      }
    }

    const updateData = {
      name: name.trim(),
      description: description?.trim() || '',
      ...(existingContent.isViewable && { itemType }),
    }

    await contentService.update(contentId, updateData)

    // Using dynamic rendering for fresh data

    return {
      success: true,
      message: 'Content updated successfully',
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error updating content:', error)
    }
    return {
      success: false,
      error: 'Failed to update content. Please try again.',
    }
  }
}

export async function deleteContentAction(contentId: string) {
  let universeId: string

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

    // Store universeId for redirect
    universeId = existingContent.universeId

    // Delete relationships first
    await relationshipService.deleteAllForContent(contentId)

    // Delete the content
    await contentService.delete(contentId)

    // Using dynamic rendering for fresh data
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error deleting content:', error)
    }
    return {
      success: false,
      error: 'Failed to delete content. Please try again.',
    }
  }

  // Redirect outside try/catch block as recommended by Next.js docs
  redirect(`/universes/${universeId}`)
}
