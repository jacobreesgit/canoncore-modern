'use server'

import { auth } from '@/auth'
import { UniverseService } from '@/lib/services/universe.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createUniverseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  isPublic: z.boolean().default(false),
})

const updateUniverseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().min(1, 'Description is required'),
  isPublic: z.boolean().default(false),
})

const deleteUniverseSchema = z.object({
  id: z.string().uuid(),
})

const updateUniverseOrderSchema = z.object({
  orderUpdates: z.array(
    z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })
  ),
})

export async function createUniverse(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      isPublic: formData.get('isPublic') === 'true',
    }

    const validatedData = createUniverseSchema.parse(rawData)

    const universe = await UniverseService.create(
      validatedData,
      session.user.id
    )

    revalidatePath('/dashboard')
    redirect(`/universes/${universe.id}`)
  } catch (error) {
    console.error('Error creating universe:', error)

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
        error instanceof Error ? error.message : 'Failed to create universe',
    }
  }
}

export async function updateUniverse(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      isPublic: formData.get('isPublic') === 'true',
    }

    const validatedData = updateUniverseSchema.parse(rawData)

    const { id, ...updateData } = validatedData
    await UniverseService.update(id, updateData, session.user.id)

    revalidatePath('/dashboard')
    revalidatePath(`/universes/${id}`)

    return { success: true }
  } catch (error) {
    console.error('Error updating universe:', error)

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
        error instanceof Error ? error.message : 'Failed to update universe',
    }
  }
}

export async function deleteUniverse(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = deleteUniverseSchema.parse(rawData)

    await UniverseService.delete(validatedData.id, session.user.id)

    revalidatePath('/dashboard')
    redirect('/dashboard')
  } catch (error) {
    console.error('Error deleting universe:', error)

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
        error instanceof Error ? error.message : 'Failed to delete universe',
    }
  }
}

export async function updateUniverseOrder(formData: FormData) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      throw new Error('Authentication required')
    }

    const rawData = {
      orderUpdates: JSON.parse(formData.get('orderUpdates') as string),
    }

    const validatedData = updateUniverseOrderSchema.parse(rawData)

    await UniverseService.updateOrder(
      validatedData.orderUpdates,
      session.user.id
    )

    revalidatePath('/dashboard')

    return { success: true }
  } catch (error) {
    console.error('Error updating universe order:', error)

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
          : 'Failed to update universe order',
    }
  }
}
