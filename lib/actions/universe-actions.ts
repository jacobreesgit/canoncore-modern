'use server'

import { auth } from '@/auth'
import { UniverseService } from '@/lib/services/universe.service'
import { z, type ZodIssue } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const createUniverseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
  isPublic: z.boolean().default(false),
})

const updateUniverseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().optional(),
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
  let createdUniverseId: string

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
      isPublic: formData.get('isPublic') === 'true',
    }

    const validatedData = createUniverseSchema.parse(rawData)

    const result = await UniverseService.create(validatedData, session.user.id)

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    createdUniverseId = result.data.id
    revalidatePath('/dashboard')
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

  // Redirect outside try/catch as per Next.js best practices
  redirect(`/universes/${createdUniverseId}`)
}

export async function updateUniverse(formData: FormData) {
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
      isPublic: formData.get('isPublic') === 'true',
    }

    const validatedData = updateUniverseSchema.parse(rawData)

    const { id, ...updateData } = validatedData
    const result = await UniverseService.update(id, updateData, session.user.id)

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

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
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const rawData = {
      id: formData.get('id') as string,
    }

    const validatedData = deleteUniverseSchema.parse(rawData)

    const result = await UniverseService.delete(
      validatedData.id,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    revalidatePath('/dashboard')
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

  // Redirect outside try/catch as per Next.js best practices
  redirect('/dashboard')
}

export async function updateUniverseOrder(formData: FormData) {
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
    }

    const validatedData = updateUniverseOrderSchema.parse(rawData)

    const result = await UniverseService.updateOrder(
      validatedData.orderUpdates,
      session.user.id
    )

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

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
