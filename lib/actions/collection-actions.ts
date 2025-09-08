'use server'

import { auth } from '@/auth'
import { CollectionService } from '@/lib/services/collection.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createCollectionSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  universeId: z.string().uuid(),
})

const updateCollectionSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
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
  let createdCollection: { universeId: string; id: string }

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
      universeId: formData.get('universeId') as string,
    }

    const validatedData = createCollectionSchema.parse(rawData)

    const result = await CollectionService.create(
      validatedData,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    createdCollection = { universeId: validatedData.universeId, id: result.data.id }
    revalidatePath(`/universes/${validatedData.universeId}`)
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

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${createdCollection.universeId}/collections/${createdCollection.id}`)
}

export async function updateCollection(formData: FormData) {
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
    }

    const validatedData = updateCollectionSchema.parse(rawData)

    const { id, ...updateData } = validatedData
    const result = await CollectionService.update(
      id,
      updateData,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    revalidatePath(`/universes/${result.data.universeId}`)
    revalidatePath(`/universes/${result.data.universeId}/collections/${id}`)

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
  let universeId: string

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

    const validatedData = deleteCollectionSchema.parse(rawData)

    // Get collection info before deletion for redirect
    const collectionResult = await CollectionService.getById(
      validatedData.id,
      session.user.id
    )
    if (!collectionResult.success) {
      return {
        success: false,
        error: collectionResult.error,
        code: collectionResult.code,
      }
    }

    const deleteResult = await CollectionService.delete(
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

    universeId = collectionResult.data!.universeId
    revalidatePath(`/universes/${collectionResult.data!.universeId}`)
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

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${universeId}`)
}

export async function updateCollectionOrder(formData: FormData) {
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
      universeId: formData.get('universeId') as string,
    }

    const validatedData = updateCollectionOrderSchema.parse(rawData)

    const result = await CollectionService.updateOrder(
      validatedData.orderUpdates,
      validatedData.universeId,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

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
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const validatedData = reorderCollectionsSchema.parse(data)

    const result = await CollectionService.updateOrder(
      validatedData.items,
      validatedData.universeId,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

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
