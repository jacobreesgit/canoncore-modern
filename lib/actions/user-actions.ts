'use server'

import { auth } from '@/lib/auth'
import { userService } from '@/lib/services/user.service'
import { z } from 'zod'

/**
 * Server Actions for User Management
 *
 * Handles server-side mutations for user operations:
 * - Profile updates with validation
 * - Authentication and authorization checks
 * - Database persistence through UserService
 * - Fresh data on every request
 * - Error handling and user feedback
 */

// Validation schema for profile updates
const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),
  email: z.string().email('Please enter a valid email address').trim(),
})

export interface UserActionResult {
  success: boolean
  error?: string
  data?: unknown
  errors?: {
    name?: string[]
    email?: string[]
  }
}

export interface UserActionState {
  errors?: {
    name?: string[]
    email?: string[]
  }
  message?: string
  success?: boolean
}

/**
 * Update user profile with validation and authorization
 * Compatible with useActionState hook
 */
export async function updateProfileAction(
  prevState: UserActionState | undefined,
  formData: FormData
): Promise<UserActionState> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        message: 'Authentication required',
        success: false,
      }
    }

    // Extract and validate form data
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    console.log('[updateProfileAction] Form data:', { name, email })
    console.log('[updateProfileAction] User ID:', session.user.id)

    const validationResult = updateProfileSchema.safeParse({
      name,
      email,
    })

    console.log('[updateProfileAction] Validation result:', validationResult)

    if (!validationResult.success) {
      return {
        errors: validationResult.error.flatten().fieldErrors,
        success: false,
      }
    }

    const { name: validatedName, email: validatedEmail } = validationResult.data

    // Check if email is already in use by another user
    if (validatedEmail !== session.user.email) {
      const existingUser = await userService.getByEmail(validatedEmail)
      if (existingUser && existingUser.id !== session.user.id) {
        return {
          errors: { email: ['Email already in use by another account'] },
          success: false,
        }
      }
    }

    // Update the profile
    console.log('[updateProfileAction] Updating profile with:', {
      name: validatedName,
      email: validatedEmail,
    })
    const updatedUser = await userService.updateProfile(session.user.id, {
      name: validatedName,
      email: validatedEmail,
    })

    console.log('[updateProfileAction] Update result:', updatedUser)

    if (!updatedUser) {
      console.log('[updateProfileAction] Update failed - no user returned')
      return {
        message: 'Failed to update profile',
        success: false,
      }
    }

    // Using dynamic rendering for fresh data
    console.log('[updateProfileAction] Profile updated successfully')

    return {
      message: 'Profile updated successfully!',
      success: true,
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    return {
      message: 'Failed to update profile. Please try again.',
      success: false,
    }
  }
}

/**
 * Get current user profile (for form initialization)
 */
export async function getCurrentUserProfileAction(): Promise<{
  success: boolean
  data?: { id: string; name: string | null; email: string }
  error?: string
}> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const user = await userService.getById(session.user.id)

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return {
      success: false,
      error: 'Failed to fetch profile',
    }
  }
}

/**
 * Delete user account and all associated data
 * This will permanently delete the user and cascade to delete all related data:
 * - All universes created by the user
 * - All content within those universes
 * - All user progress records
 * - All user favorites
 * - All authentication sessions and accounts
 *
 * Requires password verification for security
 */
export async function deleteAccountAction(
  formData: FormData
): Promise<UserActionResult> {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    // Extract form data
    const password = formData.get('password') as string
    const confirmText = formData.get('confirmText') as string

    // Validate inputs
    if (!password?.trim()) {
      return {
        success: false,
        error: 'Password is required to confirm deletion',
      }
    }

    if (confirmText !== 'DELETE') {
      return {
        success: false,
        error: 'Please type DELETE to confirm account deletion',
      }
    }

    // Verify password before deletion
    const bcrypt = await import('bcryptjs')
    const user = await userService.getById(session.user.id)

    if (!user || !user.passwordHash) {
      return {
        success: false,
        error: 'Unable to verify account credentials',
      }
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid password. Please try again.',
      }
    }

    // Delete user and all associated data
    // This will cascade to delete universes, content, progress, and favourites
    await userService.deleteUser(session.user.id)

    return {
      success: true,
      data: {
        message: 'Account deleted successfully',
        userId: session.user.id,
      },
    }
  } catch (error) {
    console.error('Error deleting account:', error)
    return {
      success: false,
      error: 'Failed to delete account. Please try again.',
    }
  }
}
