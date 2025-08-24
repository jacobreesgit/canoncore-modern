import { ZodSchema } from 'zod'
import { formatZodError, type FormErrors } from '@/lib/errors/error-utils'

/**
 * Form validation utilities
 */

export interface ValidationResult<T> {
  success: boolean
  data?: T
  errors?: FormErrors
}

/**
 * Validates form data using a Zod schema
 */
export function validateFormData<T>(
  schema: ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  try {
    const result = schema.safeParse(data)

    if (result.success) {
      return {
        success: true,
        data: result.data,
      }
    } else {
      return {
        success: false,
        errors: formatZodError(result.error),
      }
    }
  } catch {
    return {
      success: false,
      errors: {
        formErrors: ['An unexpected validation error occurred'],
        fieldErrors: {},
      },
    }
  }
}

/**
 * Validates FormData object using a Zod schema
 */
export function validateFormDataObject<T>(
  schema: ZodSchema<T>,
  formData: FormData
): ValidationResult<T> {
  // Convert FormData to a plain object
  const data: Record<string, unknown> = {}

  for (const [key, value] of formData.entries()) {
    if (key in data) {
      // Handle multiple values for the same key (like checkboxes)
      const existingValue = data[key]
      if (Array.isArray(existingValue)) {
        existingValue.push(value)
      } else {
        data[key] = [existingValue, value]
      }
    } else {
      // Handle boolean conversion for checkboxes
      if (value === 'on' || value === 'true') {
        data[key] = true
      } else if (value === 'false') {
        data[key] = false
      } else {
        data[key] = value
      }
    }
  }

  return validateFormData(schema, data)
}

/**
 * Validates a single field using a Zod schema
 */
export function validateField<T>(
  schema: ZodSchema<T>,
  value: unknown
): { isValid: boolean; error?: string } {
  try {
    const result = schema.safeParse(value)

    if (result.success) {
      return { isValid: true }
    } else {
      const firstError = result.error.issues[0]
      return {
        isValid: false,
        error: firstError.message,
      }
    }
  } catch {
    return {
      isValid: false,
      error: 'Validation error',
    }
  }
}

/**
 * Custom hook for form validation
 */
export function useFormValidation<T>(schema: ZodSchema<T>) {
  return {
    validate: (data: unknown) => validateFormData(schema, data),
    validateField: (value: unknown) => validateField(schema, value),
  }
}

/**
 * Validation middleware for API routes
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T, ...args: unknown[]) => Promise<Response>
) {
  return async (request: Request, ...args: unknown[]): Promise<Response> => {
    try {
      let data: unknown

      const contentType = request.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        data = await request.json()
      } else if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData()
        const result = validateFormDataObject(schema, formData)
        if (!result.success) {
          return Response.json({ errors: result.errors }, { status: 400 })
        }
        data = result.data
      } else {
        return Response.json(
          { error: 'Unsupported content type' },
          { status: 400 }
        )
      }

      const validation = validateFormData(schema, data)

      if (!validation.success) {
        return Response.json({ errors: validation.errors }, { status: 400 })
      }

      return await handler(validation.data!, ...args)
    } catch (error) {
      console.error('Validation middleware error:', error)
      return Response.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

/**
 * Async validation for complex scenarios
 */
export async function validateAsync<T>(
  schema: ZodSchema<T>,
  data: unknown,
  customValidations?: Array<(data: T) => Promise<string | null>>
): Promise<ValidationResult<T>> {
  // First, run Zod validation
  const zodResult = validateFormData(schema, data)

  if (!zodResult.success || !zodResult.data) {
    return zodResult
  }

  // Run custom async validations
  if (customValidations && customValidations.length > 0) {
    const validationErrors: string[] = []

    for (const validation of customValidations) {
      try {
        const error = await validation(zodResult.data)
        if (error) {
          validationErrors.push(error)
        }
      } catch {
        validationErrors.push('Validation failed')
      }
    }

    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: {
          formErrors: validationErrors,
          fieldErrors: {},
        },
      }
    }
  }

  return zodResult
}

/**
 * Get first error message from validation result
 */
export function getFirstError(errors: FormErrors): string | null {
  if (errors.formErrors.length > 0) {
    return errors.formErrors[0]
  }

  const fieldErrorValues = Object.values(errors.fieldErrors)
  for (const fieldErrors of fieldErrorValues) {
    if (Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors[0]
    }
  }

  return null
}
