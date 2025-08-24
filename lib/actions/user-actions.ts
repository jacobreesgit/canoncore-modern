'use server'

import { auth } from '@/lib/auth'
import { userService } from '@/lib/services/user.service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Server Actions for User Management
 *
 * Handles server-side mutations for user operations:
 * - Profile updates with validation
 * - Authentication and authorization checks
 * - Database persistence through UserService
 * - Cache revalidation for updated data
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
}

/**
 * Update user profile with validation and authorization
 */
export async function updateProfileAction(
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

    // Extract and validate form data
    const name = formData.get('name') as string
    const email = formData.get('email') as string

    const validationResult = updateProfileSchema.safeParse({
      name,
      email,
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        success: false,
        error: firstError.message,
      }
    }

    const { name: validatedName, email: validatedEmail } = validationResult.data

    // Check if email is already in use by another user
    if (validatedEmail !== session.user.email) {
      const existingUser = await userService.getByEmail(validatedEmail)
      if (existingUser && existingUser.id !== session.user.id) {
        return {
          success: false,
          error: 'Email already in use by another account',
        }
      }
    }

    // Update the profile
    const updatedUser = await userService.updateProfile(session.user.id, {
      name: validatedName,
      email: validatedEmail,
    })

    if (!updatedUser) {
      return {
        success: false,
        error: 'Failed to update profile',
      }
    }

    // Comprehensive cache revalidation
    revalidatePath(`/profile/${session.user.id}`)
    revalidatePath(`/profile/${session.user.id}/edit`)
    revalidatePath('/dashboard')
    revalidatePath('/discover')

    // Revalidate any universe pages where user is the owner
    // The userService could track owned universes for more targeted revalidation

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        updatedAt: updatedUser.updatedAt,
      },
    }
  } catch (error) {
    console.error('Error updating profile:', error)
    return {
      success: false,
      error: 'Failed to update profile. Please try again.',
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
 * Delete user account (optional - for complete user management)
 * TODO: Implement deleteUser method in UserService
 */
// export async function deleteAccountAction(): Promise<UserActionResult> {
//   try {
//     const session = await auth()

//     if (!session?.user?.id) {
//       return {
//         success: false,
//         error: 'Authentication required',
//       }
//     }

//     // Delete user and all associated data
//     // This will cascade to delete universes, content, progress, and favourites
//     await userService.deleteUser(session.user.id)

//     // Note: In a real implementation, you'd also want to:
//     // 1. Sign out the user
//     // 2. Clear all sessions
//     // 3. Redirect to homepage

//     return {
//       success: true,
//     }
//   } catch (error) {
//     console.error('Error deleting account:', error)
//     return {
//       success: false,
//       error: 'Failed to delete account. Please try again.',
//     }
//   }
// }
