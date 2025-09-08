'use server'

import { auth } from '@/auth'
import { GroupService } from '@/lib/services/group.service'
import { CollectionService } from '@/lib/services/collection.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  collectionId: z.string().uuid(),
  itemType: z
    .enum(['series', 'movie', 'book', 'game', 'other'])
    .default('other'),
})

const updateGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  itemType: z
    .enum(['series', 'movie', 'book', 'game', 'other'])
    .default('other'),
})

const deleteGroupSchema = z.object({
  id: z.string().uuid(),
})

const updateGroupOrderSchema = z.object({
  orderUpdates: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
  collectionId: z.string().uuid(),
})

const reorderGroupsSchema = z.object({
  collectionId: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
})

const moveGroupSchema = z.object({
  groupId: z.string().uuid(),
  newParentId: z.string().uuid().nullable(),
  newOrder: z.number().int().min(0),
})

export async function createGroup(formData: FormData) {
  let createdGroup: { universeId: string; collectionId: string; id: string }

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      collectionId: formData.get('collectionId') as string,
      itemType: (formData.get('itemType') as string) || 'other',
    }

    const validatedData = createGroupSchema.parse(rawData)

    const groupResult = await GroupService.create(
      validatedData,
      session.user.id
    )
    if (!groupResult.success) {
      return {
        success: false,
        error: groupResult.error,
        code: groupResult.code,
      }
    }

    // Get collection for navigation
    const collectionResult = await CollectionService.getById(
      validatedData.collectionId,
      session.user.id
    )
    if (!collectionResult.success) {
      return {
        success: false,
        error: collectionResult.error,
        code: collectionResult.code,
      }
    }

    createdGroup = {
      universeId: collectionResult.data!.universeId,
      collectionId: validatedData.collectionId,
      id: groupResult.data!.id
    }
    revalidatePath(`/universes/${collectionResult.data!.universeId}`)
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${validatedData.collectionId}`
    )
  } catch (error) {
    console.error('Error creating group:', error)

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
      error: error instanceof Error ? error.message : 'Failed to create group',
    }
  }

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${createdGroup.universeId}/collections/${createdGroup.collectionId}/groups/${createdGroup.id}`)
}

export async function updateGroup(formData: FormData) {
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
    }

    const validatedData = updateGroupSchema.parse(rawData)

    const { id, ...updateData } = validatedData
    const groupResult = await GroupService.update(
      id,
      updateData,
      session.user.id
    )
    if (!groupResult.success) {
      return {
        success: false,
        error: groupResult.error,
        code: groupResult.code,
      }
    }

    // Get collection for navigation
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
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}/groups/${id}`
    )

    return { success: true }
  } catch (error) {
    console.error('Error updating group:', error)

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
      error: error instanceof Error ? error.message : 'Failed to update group',
    }
  }
}

export async function deleteGroup(formData: FormData) {
  let redirectInfo: { universeId: string; collectionId: string }

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

    const validatedData = deleteGroupSchema.parse(rawData)

    // Get group info before deletion for redirect
    const groupResult = await GroupService.getById(
      validatedData.id,
      session.user.id
    )
    if (!groupResult.success) {
      return {
        success: false,
        error: groupResult.error,
        code: groupResult.code,
      }
    }

    // Get collection for navigation
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

    const deleteResult = await GroupService.delete(
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

    redirectInfo = {
      universeId: collectionResult.data!.universeId,
      collectionId: groupResult.data!.collectionId
    }
    revalidatePath(`/universes/${collectionResult.data!.universeId}`)
    revalidatePath(
      `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
    )
  } catch (error) {
    console.error('Error deleting group:', error)

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
      error: error instanceof Error ? error.message : 'Failed to delete group',
    }
  }

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${redirectInfo.universeId}/collections/${redirectInfo.collectionId}`)
}

export async function updateGroupOrder(formData: FormData) {
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
      collectionId: formData.get('collectionId') as string,
    }

    const validatedData = updateGroupOrderSchema.parse(rawData)

    const result = await GroupService.updateOrder(
      validatedData.orderUpdates,
      validatedData.collectionId,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    // Get collection for navigation
    const collectionResult = await CollectionService.getById(
      validatedData.collectionId,
      session.user.id
    )
    if (collectionResult.success) {
      revalidatePath(`/universes/${collectionResult.data!.universeId}`)
      revalidatePath(
        `/universes/${collectionResult.data!.universeId}/collections/${validatedData.collectionId}`
      )
    }

    return { success: true }
  } catch (error) {
    console.error('Error updating group order:', error)

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
        error instanceof Error ? error.message : 'Failed to update group order',
    }
  }
}

export async function reorderGroupsAction(data: {
  collectionId: string
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

    const validatedData = reorderGroupsSchema.parse(data)

    const result = await GroupService.updateOrder(
      validatedData.items,
      validatedData.collectionId,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    // Get collection for cache invalidation
    const collectionResult = await CollectionService.getById(
      validatedData.collectionId,
      session.user.id
    )
    if (collectionResult.success) {
      revalidatePath(`/universes/${collectionResult.data!.universeId}`)
      revalidatePath(
        `/universes/${collectionResult.data!.universeId}/collections/${validatedData.collectionId}`
      )
    }

    return { success: true }
  } catch (error) {
    console.error('Error reordering groups:', error)

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
        error instanceof Error ? error.message : 'Failed to reorder groups',
    }
  }
}

export async function moveGroupAction(data: {
  groupId: string
  newParentId: string | null
  newOrder: number
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const validatedData = moveGroupSchema.parse(data)

    // For now, just update the order since hierarchical group moves need relationship service
    // This is a placeholder - would need to implement group relationship handling
    console.warn(
      'Group hierarchical move not yet implemented, treating as reorder'
    )

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

    // Update order only for now
    const updateResult = await GroupService.updateOrder(
      [{ id: validatedData.groupId, order: validatedData.newOrder }],
      groupResult.data!.collectionId,
      session.user.id
    )
    if (!updateResult.success) {
      return {
        success: false,
        error: updateResult.error,
        code: updateResult.code,
      }
    }

    // Get collection for cache invalidation
    const collectionResult = await CollectionService.getById(
      groupResult.data!.collectionId,
      session.user.id
    )
    if (collectionResult.success) {
      revalidatePath(`/universes/${collectionResult.data!.universeId}`)
      revalidatePath(
        `/universes/${collectionResult.data!.universeId}/collections/${groupResult.data!.collectionId}`
      )
    }

    return { success: true }
  } catch (error) {
    console.error('Error moving group:', error)

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
      error: error instanceof Error ? error.message : 'Failed to move group',
    }
  }
}
