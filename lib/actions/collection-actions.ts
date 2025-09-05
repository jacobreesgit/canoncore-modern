'use server'

import { auth } from '@/auth'
import { CollectionService } from '@/lib/services/collection.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  universeId: z.string().uuid(),
})

const updateCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
})

const deleteCollectionSchema = z.object({
  id: z.string().uuid(),
})

const updateCollectionOrderSchema = z.object({
  orderUpdates: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
  universeId: z.string().uuid(),
})

const reorderCollectionsSchema = z.object({
  universeId: z.string().uuid(),
  items: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
})

export async function createCollection(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      universeId: formData.get('universeId') as string,
    }

    const validatedData = createCollectionSchema.parse(rawData)

    const collection = await CollectionService.create(
      validatedData,
      session.user.id
    )

    revalidatePath(`/universes/${validatedData.universeId}`)
    redirect(
      `/universes/${validatedData.universeId}/collections/${collection.id}`
    )
  } catch (error) {
    console.error('Error creating collection:', error)

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
        error instanceof Error ? error.message : 'Failed to create collection',
    }
  }
}

export async function updateCollection(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
    }

    const validatedData = updateCollectionSchema.parse(rawData)

    const { id, ...updateData } = validatedData
    const collection = await CollectionService.update(
      id,
      updateData,
      session.user.id
    )

    revalidatePath(`/universes/${collection.universeId}`)
    revalidatePath(`/universes/${collection.universeId}/collections/${id}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating collection:', error)

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
        error instanceof Error ? error.message : 'Failed to update collection',
    }
  }
}

export async function deleteCollection(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = deleteCollectionSchema.parse(rawData)

    // Get collection info before deletion for redirect
    const collection = await CollectionService.getById(
      validatedData.id,
      session.user.id
    )
    if (!collection) {
      throw new Error('Collection not found')
    }

    await CollectionService.delete(validatedData.id, session.user.id)

    revalidatePath(`/universes/${collection.universeId}`)
    redirect(`/universes/${collection.universeId}`)
  } catch (error) {
    console.error('Error deleting collection:', error)

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
        error instanceof Error ? error.message : 'Failed to delete collection',
    }
  }
}

export async function updateCollectionOrder(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      orderUpdates: JSON.parse(formData.get('orderUpdates') as string),
      universeId: formData.get('universeId') as string,
    }

    const validatedData = updateCollectionOrderSchema.parse(rawData)

    await CollectionService.updateOrder(
      validatedData.orderUpdates,
      validatedData.universeId,
      session.user.id
    )

    revalidatePath(`/universes/${validatedData.universeId}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating collection order:', error)

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
          : 'Failed to update collection order',
    }
  }
}

export async function reorderCollectionsAction(data: {
  universeId: string
  items: { id: string; order: number }[]
}) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const validatedData = reorderCollectionsSchema.parse(data)

    await CollectionService.updateOrder(
      validatedData.items,
      validatedData.universeId,
      session.user.id
    )

    revalidatePath(`/universes/${validatedData.universeId}`)

    return { success: true }
  } catch (error) {
    console.error('Error reordering collections:', error)

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
          : 'Failed to reorder collections',
    }
  }
}
