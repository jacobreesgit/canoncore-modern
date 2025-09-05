'use server'

import { auth } from '@/auth'
import { ContentService } from '@/lib/services/content.service'
import { GroupService } from '@/lib/services/group.service'
import { CollectionService } from '@/lib/services/collection.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createContentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  groupId: z.string().uuid(),
  itemType: z
    .enum(['episode', 'movie', 'chapter', 'level', 'other'])
    .default('other'),
  releaseDate: z
    .string()
    .optional()
    .transform(val => (val && val.trim() ? val : null))
    .refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
  isViewable: z.boolean().default(false),
})

const updateContentSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  itemType: z
    .enum(['episode', 'movie', 'chapter', 'level', 'other'])
    .default('other'),
  releaseDate: z
    .string()
    .optional()
    .transform(val => (val && val.trim() ? val : null))
    .refine(val => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
  isViewable: z.boolean().default(false),
})

const deleteContentSchema = z.object({
  id: z.string().uuid(),
})

const updateContentOrderSchema = z.object({
  orderUpdates: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
  groupId: z.string().uuid(),
})

const toggleContentViewableSchema = z.object({
  id: z.string().uuid(),
})

const reorderContentSchema = z.object({
  groupId: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
})

const moveContentSchema = z.object({
  contentId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
  newOrder: z.number().int().min(0),
})

export async function createContent(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      groupId: formData.get('groupId') as string,
      itemType: (formData.get('itemType') as string) || 'other',
      releaseDate: formData.get('releaseDate') as string,
      isViewable: formData.get('isViewable') === 'true',
    }

    const validatedData = createContentSchema.parse(rawData)

    const content = await ContentService.create(validatedData, session.user.id)

    // Get navigation info
    const group = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (!group) {
      throw new Error('Group not found')
    }

    const collection = await CollectionService.getById(
      group.collectionId,
      session.user.id
    )
    if (!collection) {
      throw new Error('Collection not found')
    }

    revalidatePath(`/universes/${collection.universeId}`)
    revalidatePath(
      `/universes/${collection.universeId}/collections/${group.collectionId}`
    )
    revalidatePath(
      `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${validatedData.groupId}`
    )
    redirect(
      `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${validatedData.groupId}/content/${content.id}`
    )
  } catch (error) {
    console.error('Error creating content:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to create content',
    }
  }
}

export async function updateContent(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      itemType: (formData.get('itemType') as string) || 'other',
      releaseDate: formData.get('releaseDate') as string,
      isViewable: formData.get('isViewable') === 'true',
    }

    const validatedData = updateContentSchema.parse(rawData)

    const { id, ...updateData } = validatedData

    const content = await ContentService.update(id, updateData, session.user.id)

    // Get navigation info
    const group = await GroupService.getById(content.groupId, session.user.id)
    if (group) {
      const collection = await CollectionService.getById(
        group.collectionId,
        session.user.id
      )
      if (collection) {
        revalidatePath(`/universes/${collection.universeId}`)
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}/content/${id}`
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating content:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to update content',
    }
  }
}

export async function deleteContent(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = deleteContentSchema.parse(rawData)

    // Get content info before deletion for redirect
    const content = await ContentService.getById(
      validatedData.id,
      session.user.id
    )
    if (!content) {
      throw new Error('Content not found')
    }

    const group = await GroupService.getById(content.groupId, session.user.id)
    if (!group) {
      throw new Error('Group not found')
    }

    const collection = await CollectionService.getById(
      group.collectionId,
      session.user.id
    )
    if (!collection) {
      throw new Error('Collection not found')
    }

    await ContentService.delete(validatedData.id, session.user.id)

    revalidatePath(`/universes/${collection.universeId}`)
    revalidatePath(
      `/universes/${collection.universeId}/collections/${group.collectionId}`
    )
    revalidatePath(
      `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}`
    )
    redirect(
      `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}`
    )
  } catch (error) {
    console.error('Error deleting content:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to delete content',
    }
  }
}

export async function updateContentOrder(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      orderUpdates: JSON.parse(formData.get('orderUpdates') as string),
      groupId: formData.get('groupId') as string,
    }

    const validatedData = updateContentOrderSchema.parse(rawData)

    await ContentService.updateOrder(
      validatedData.orderUpdates,
      validatedData.groupId,
      session.user.id
    )

    // Get navigation info for revalidation
    const group = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (group) {
      const collection = await CollectionService.getById(
        group.collectionId,
        session.user.id
      )
      if (collection) {
        revalidatePath(`/universes/${collection.universeId}`)
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${validatedData.groupId}`
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating content order:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update content order',
    }
  }
}

export async function toggleContentViewable(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = toggleContentViewableSchema.parse(rawData)

    const content = await ContentService.toggleViewable(
      validatedData.id,
      session.user.id
    )

    // Get navigation info for revalidation
    const group = await GroupService.getById(content.groupId, session.user.id)
    if (group) {
      const collection = await CollectionService.getById(
        group.collectionId,
        session.user.id
      )
      if (collection) {
        revalidatePath(`/universes/${collection.universeId}`)
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}/content/${validatedData.id}`
        )
      }
    }

    return {
      success: true,
      isViewable: content.isViewable,
    }
  } catch (error) {
    console.error('Error toggling content viewability:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to toggle content viewability',
    }
  }
}

export async function reorderContentAction(data: {
  groupId: string
  items: { id: string; order: number }[]
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const validatedData = reorderContentSchema.parse(data)

    // Use the existing updateOrder method - need to check if ContentService has this method
    await ContentService.updateOrder(
      validatedData.items,
      validatedData.groupId,
      session.user.id
    )

    // Get navigation info for revalidation
    const group = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (group) {
      const collection = await CollectionService.getById(
        group.collectionId,
        session.user.id
      )
      if (collection) {
        revalidatePath(`/universes/${collection.universeId}`)
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${validatedData.groupId}`
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error reordering content:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to reorder content',
    }
  }
}

export async function moveContentAction(data: {
  contentId: string
  newParentId: string | null
  newOrder: number
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const validatedData = moveContentSchema.parse(data)

    // For now, just update the order since hierarchical content moves need relationship service
    // This is a placeholder - would need to implement content relationship handling
    console.warn(
      'Content hierarchical move not yet implemented, treating as reorder'
    )

    const content = await ContentService.getById(
      validatedData.contentId,
      session.user.id
    )
    if (!content) {
      throw new Error('Content not found')
    }

    // Update order only for now
    await ContentService.updateOrder(
      [{ id: validatedData.contentId, order: validatedData.newOrder }],
      content.groupId,
      session.user.id
    )

    // Get navigation info for revalidation
    const group = await GroupService.getById(content.groupId, session.user.id)
    if (group) {
      const collection = await CollectionService.getById(
        group.collectionId,
        session.user.id
      )
      if (collection) {
        revalidatePath(`/universes/${collection.universeId}`)
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}`
        )
        revalidatePath(
          `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${content.groupId}`
        )
      }
    }

    return { success: true }
  } catch (error) {
    console.error('Error moving content:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Validation failed',
        details: error.issues.map(
          (e: ZodIssue) => `${e.path.join('.')}: ${e.message}`
        ),
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move content',
    }
  }
}
