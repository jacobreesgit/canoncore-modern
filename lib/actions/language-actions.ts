'use server'

import { auth } from '@/auth'
import { UserService } from '@/lib/services/user.service'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

/**
 * Server action to update user's language preference
 * Uses the standard updateProfile method for consistency
 */
export async function updateUserLanguagePreference(
  preferredLanguage: 'en-GB' | 'en-US'
) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      }
    }

    // Update user's language preference using standard updateProfile method
    const result = await UserService.updateProfile(session.user.id, {
      preferredLanguage,
    })

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    // Revalidate relevant paths to reflect language change
    revalidatePath('/', 'layout')
    revalidatePath('/dashboard')
    revalidatePath('/universes')

    return {
      success: true,
      message: 'Language preference updated successfully',
    }
  } catch (error) {
    console.error('updateUserLanguagePreference error:', error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
        code: 'VALIDATION_ERROR',
      }
    }

    return {
      success: false,
      error: 'Failed to update language preference',
      code: 'SERVER_ERROR',
    }
  }
}

/**
 * Server action to get user's current language preference
 * Uses the standard findById method for consistency
 */
export async function getUserLanguagePreference() {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return {
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      }
    }

    // Get user data including language preference
    const result = await UserService.findById(session.user.id)

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
      }
    }

    return {
      success: true,
      data: {
        language: result.data.preferredLanguage,
      },
    }
  } catch (error) {
    console.error('getUserLanguagePreference error:', error)
    return {
      success: false,
      error: 'Failed to get language preference',
      code: 'SERVER_ERROR',
    }
  }
}
