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
  description: z.string().optional(),
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
  description: z.string().optional(),
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
  let createdContent: { universeId: string; collectionId: string; groupId: string; id: string }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const description = formData.get('description') as string
    const rawData = {
      name: formData.get('name') as string,
      description: description || undefined,
      groupId: formData.get('groupId') as string,
      itemType: (formData.get('itemType') as string) || 'other',
      releaseDate: formData.get('releaseDate') as string,
      isViewable: formData.get('isViewable') === 'true',
    }

    const validatedData = createContentSchema.parse(rawData)

    const contentResult = await ContentService.create(
      validatedData,
      session.user.id
    )
    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error,
        code: contentResult.code,
      }
    }

    // Get navigation info
    const groupResult = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (!groupResult.success) {
      return {
        success: false,
        error: groupResult.error,
        code: groupResult.code,
      }
    }

    const collectionResult = await CollectionService.getById(
      groupResult.data!.collectionId,
      session.user.id
    )
    if (!collectionResult.success) {
      return {
        success: false,
        error: collectionResult.error,
        code: collectionResult.code,
      }
    }

    revalidatePath(`/universes/${collectionResult.data!.universeId}`)
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
    )
    createdContent = {
      universeId: collectionResult.data!.universeId,
      collectionId: groupResult.data!.collectionId,
      groupId: validatedData.groupId,
      id: contentResult.data!.id
    }
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${validatedData.groupId}`
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

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${createdContent.universeId}/collections/${createdContent.collectionId}/groups/${createdContent.groupId}/content/${createdContent.id}`)
}

export async function updateContent(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
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

    const contentResult = await ContentService.update(
      id,
      updateData,
      session.user.id
    )
    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error,
        code: contentResult.code,
      }
    }

    // Get navigation info
    const groupResult = await GroupService.getById(
      contentResult.data!.groupId,
      session.user.id
    )
    if (groupResult.success) {
      const collectionResult = await CollectionService.getById(
        groupResult.data!.collectionId,
        session.user.id
      )
      if (collectionResult.success) {
        revalidatePath(`/universes/${collectionResult.data!.universeId}`)
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${contentResult.data!.groupId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${contentResult.data!.groupId}/content/${id}`
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
  let redirectInfo: { universeId: string; collectionId: string; groupId: string }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = deleteContentSchema.parse(rawData)

    // Get content info before deletion for redirect
    const contentResult = await ContentService.getById(
      validatedData.id,
      session.user.id
    )
    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error,
        code: contentResult.code,
      }
    }

    const groupResult = await GroupService.getById(
      contentResult.data!.groupId,
      session.user.id
    )
    if (!groupResult.success) {
      return {
        success: false,
        error: groupResult.error,
        code: groupResult.code,
      }
    }

    const collectionResult = await CollectionService.getById(
      groupResult.data!.collectionId,
      session.user.id
    )
    if (!collectionResult.success) {
      return {
        success: false,
        error: collectionResult.error,
        code: collectionResult.code,
      }
    }

    const deleteResult = await ContentService.delete(
      validatedData.id,
      session.user.id
    )
    if (!deleteResult.success) {
      return {
        success: false,
        error: deleteResult.error,
        code: deleteResult.code,
      }
    }

    revalidatePath(`/universes/${collectionResult.data!.universeId}`)
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
    )
    redirectInfo = {
      universeId: collectionResult.data!.universeId,
      collectionId: groupResult.data!.collectionId,
      groupId: contentResult.data!.groupId
    }
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${contentResult.data!.groupId}`
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

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${redirectInfo.universeId}/collections/${redirectInfo.collectionId}/groups/${redirectInfo.groupId}`)
}

export async function updateContentOrder(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const rawData = {
      orderUpdates: JSON.parse(formData.get('orderUpdates') as string),
      groupId: formData.get('groupId') as string,
    }

    const validatedData = updateContentOrderSchema.parse(rawData)

    const result = await ContentService.updateOrder(
      validatedData.orderUpdates,
      validatedData.groupId,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    // Get navigation info for revalidation
    const groupResult = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (groupResult.success) {
      const collectionResult = await CollectionService.getById(
        groupResult.data!.collectionId,
        session.user.id
      )
      if (collectionResult.success) {
        revalidatePath(`/universes/${collectionResult.data!.universeId}`)
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${validatedData.groupId}`
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
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = toggleContentViewableSchema.parse(rawData)

    const contentResult = await ContentService.toggleViewable(
      validatedData.id,
      session.user.id
    )

    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error,
        code: contentResult.code,
      }
    }

    // Get navigation info for revalidation
    const groupResult = await GroupService.getById(
      contentResult.data!.groupId,
      session.user.id
    )
    if (groupResult.success) {
      const collectionResult = await CollectionService.getById(
        groupResult.data!.collectionId,
        session.user.id
      )
      if (collectionResult.success) {
        revalidatePath(`/universes/${collectionResult.data!.universeId}`)
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${contentResult.data!.groupId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${contentResult.data!.groupId}/content/${validatedData.id}`
        )
      }
    }

    return {
      success: true,
      isViewable: contentResult.data!.isViewable,
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
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const validatedData = reorderContentSchema.parse(data)

    const result = await ContentService.updateOrder(
      validatedData.items,
      validatedData.groupId,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    // Get navigation info for revalidation
    const groupResult = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (groupResult.success) {
      const collectionResult = await CollectionService.getById(
        groupResult.data!.collectionId,
        session.user.id
      )
      if (collectionResult.success) {
        revalidatePath(`/universes/${collectionResult.data!.universeId}`)
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${validatedData.groupId}`
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
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const validatedData = moveContentSchema.parse(data)

    // For now, just update the order since hierarchical content moves need relationship service
    // This is a placeholder - would need to implement content relationship handling
    console.warn(
      'Content hierarchical move not yet implemented, treating as reorder'
    )

    const contentResult = await ContentService.getById(
      validatedData.contentId,
      session.user.id
    )
    if (!contentResult.success) {
      return {
        success: false,
        error: contentResult.error,
        code: contentResult.code,
      }
    }

    // Update order only for now
    const updateResult = await ContentService.updateOrder(
      [{ id: validatedData.contentId, order: validatedData.newOrder }],
      contentResult.data!.groupId,
      session.user.id
    )
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
        code: updateResult.code,
      }
    }

    // Get navigation info for revalidation
    const groupResult = await GroupService.getById(
      contentResult.data!.groupId,
      session.user.id
    )
    if (groupResult.success) {
      const collectionResult = await CollectionService.getById(
        groupResult.data!.collectionId,
        session.user.id
      )
      if (collectionResult.success) {
        revalidatePath(`/universes/${collectionResult.data!.universeId}`)
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
        )
        revalidatePath(
          `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${contentResult.data!.groupId}`
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
