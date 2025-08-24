import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-helpers'
import { userService } from '@/lib/services'
import { z } from 'zod'

const updateUserSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .optional(),
  email: z.string().email('Invalid email address').optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await requireAuth()

    if (session.user?.id !== id) {
      return NextResponse.json(
        { error: 'Unauthorized - can only update own profile' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    if (Object.keys(validatedData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields provided for update' },
        { status: 400 }
      )
    }

    if (validatedData.email) {
      const existingUser = await userService.getByEmail(validatedData.email)
      if (existingUser && existingUser.id !== id) {
        return NextResponse.json(
          { error: 'Email already in use by another account' },
          { status: 409 }
        )
      }
    }

    const updatedUser = await userService.updateProfile(id, validatedData)

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating user profile:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
