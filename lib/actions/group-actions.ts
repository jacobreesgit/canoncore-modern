'use server'

import { auth } from '@/auth'
import { GroupService } from '@/lib/services/group.service'
import { CollectionService } from '@/lib/services/collection.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createGroupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  collectionId: z.string().uuid(),
  itemType: z
    .enum(['series', 'movie', 'book', 'game', 'other'])
    .default('other'),
})

const updateGroupSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
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
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      collectionId: formData.get('collectionId') as string,
      itemType: (formData.get('itemType') as string) || 'other',
    }

    const validatedData = createGroupSchema.parse(rawData)

    const group = await GroupService.create(validatedData, session.user.id)

    // Get collection for navigation
    const collection = await CollectionService.getById(
      validatedData.collectionId,
      session.user.id
    )
    if (!collection) {
      throw new Error('Collection not found')
    }

    revalidatePath(`/universes/${collection.universeId}`)
    revalidatePath(
      `/universes/${collection.universeId}/collections/${validatedData.collectionId}`
    )
    redirect(
      `/universes/${collection.universeId}/collections/${validatedData.collectionId}/groups/${group.id}`
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
}

export async function updateGroup(formData: FormData) {
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
    }

    const validatedData = updateGroupSchema.parse(rawData)

    const { id, ...updateData } = validatedData
    const group = await GroupService.update(id, updateData, session.user.id)

    // Get collection for navigation
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
      `/universes/${collection.universeId}/collections/${group.collectionId}/groups/${id}`
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
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = deleteGroupSchema.parse(rawData)

    // Get group info before deletion for redirect
    const group = await GroupService.getById(validatedData.id, session.user.id)
    if (!group) {
      throw new Error('Group not found')
    }

    // Get collection for navigation
    const collection = await CollectionService.getById(
      group.collectionId,
      session.user.id
    )
    if (!collection) {
      throw new Error('Collection not found')
    }

    await GroupService.delete(validatedData.id, session.user.id)

    revalidatePath(`/universes/${collection.universeId}`)
    revalidatePath(
      `/universes/${collection.universeId}/collections/${group.collectionId}`
    )
    redirect(
      `/universes/${collection.universeId}/collections/${group.collectionId}`
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
}

export async function updateGroupOrder(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      orderUpdates: JSON.parse(formData.get('orderUpdates') as string),
      collectionId: formData.get('collectionId') as string,
    }

    const validatedData = updateGroupOrderSchema.parse(rawData)

    await GroupService.updateOrder(
      validatedData.orderUpdates,
      validatedData.collectionId,
      session.user.id
    )

    // Get collection for navigation
    const collection = await CollectionService.getById(
      validatedData.collectionId,
      session.user.id
    )
    if (collection) {
      revalidatePath(`/universes/${collection.universeId}`)
      revalidatePath(
        `/universes/${collection.universeId}/collections/${validatedData.collectionId}`
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
      throw new Error('Authentication required')
    }

    const validatedData = reorderGroupsSchema.parse(data)

    await GroupService.updateOrder(
      validatedData.items,
      validatedData.collectionId,
      session.user.id
    )

    // Get collection for cache invalidation
    const collection = await CollectionService.getById(
      validatedData.collectionId,
      session.user.id
    )
    if (collection) {
      revalidatePath(`/universes/${collection.universeId}`)
      revalidatePath(
        `/universes/${collection.universeId}/collections/${validatedData.collectionId}`
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

    const group = await GroupService.getById(
      validatedData.groupId,
      session.user.id
    )
    if (!group) {
      throw new Error('Group not found')
    }

    // Update order only for now
    await GroupService.updateOrder(
      [{ id: validatedData.groupId, order: validatedData.newOrder }],
      group.collectionId,
      session.user.id
    )

    // Get collection for cache invalidation
    const collection = await CollectionService.getById(
      group.collectionId,
      session.user.id
    )
    if (collection) {
      revalidatePath(`/universes/${collection.universeId}`)
      revalidatePath(
        `/universes/${collection.universeId}/collections/${group.collectionId}`
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
