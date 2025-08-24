/**
 * Server actions with built-in validation
 */

import { redirect } from 'next/navigation'
import { ZodSchema } from 'zod'
import { validateFormDataObject } from '@/lib/validation'
import { errorTracker } from '@/lib/errors'

interface ActionResult<T = unknown> {
  success: boolean
  data?: T
  errors?: {
    formErrors: string[]
    fieldErrors: Record<string, string[]>
  }
  message?: string
}

/**
 * Creates a validated server action
 */
export function createValidatedAction<T, R = unknown>(
  schema: ZodSchema<T>,
  action: (data: T) => Promise<R | ActionResult<R>>
) {
  return async (formData: FormData): Promise<ActionResult<R>> => {
    try {
      // Validate the form data
      const validation = validateFormDataObject(schema, formData)

      if (!validation.success) {
        // Track validation error
        errorTracker.trackValidationError(
          validation.errors?.fieldErrors || {},
          {
            action: action.name || 'unknown_action',
            type: 'server_action_validation',
          }
        )

        return {
          success: false,
          errors: validation.errors,
        }
      }

      // Execute the action with validated data
      const result = await action(validation.data!)

      // Handle different result types
      if (
        typeof result === 'object' &&
        result !== null &&
        'success' in result
      ) {
        return result as ActionResult<R>
      }

      return {
        success: true,
        data: result as R,
      }
    } catch (error) {
      // Track server action error
      errorTracker.trackError(error, {
        action: action.name || 'unknown_action',
        type: 'server_action_error',
      })

      console.error('Server action error:', error)

      return {
        success: false,
        errors: {
          formErrors: ['An unexpected error occurred. Please try again.'],
          fieldErrors: {},
        },
      }
    }
  }
}

/**
 * Creates a validated server action that redirects on success
 */
export function createValidatedActionWithRedirect<T>(
  schema: ZodSchema<T>,
  action: (data: T) => Promise<void | string>, // Returns redirect path or void for default
  successRedirect = '/'
) {
  return async (formData: FormData): Promise<ActionResult | never> => {
    const validatedAction = createValidatedAction(schema, async (data: T) => {
      const redirectPath = await action(data)
      return { redirectPath: redirectPath || successRedirect }
    })

    const result = await validatedAction(formData)

    if (result.success && result.data && 'redirectPath' in result.data) {
      redirect(result.data.redirectPath as string)
    }

    return result
  }
}

/**
 * Helper for handling form submissions in components
 */
export function useActionResult<T = unknown>(
  result: ActionResult<T> | undefined
) {
  return {
    isSuccess: result?.success === true,
    isError: result?.success === false,
    data: result?.data,
    errors: result?.errors,
    formErrors: result?.errors?.formErrors || [],
    fieldErrors: result?.errors?.fieldErrors || {},
    message: result?.message,
    getFieldError: (field: string) => result?.errors?.fieldErrors[field] || [],
    hasFieldError: (field: string) =>
      Boolean(result?.errors?.fieldErrors[field]?.length),
  }
}
