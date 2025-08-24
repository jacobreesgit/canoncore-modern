'use client'

import { useState, useCallback, useEffect } from 'react'
import { ZodSchema } from 'zod'
import { validateFormData, type ValidationResult } from '@/lib/validation'
import type { FormErrors } from '@/lib/errors'

interface UseFormValidationOptions<T> {
  schema: ZodSchema<T>
  validateOnChange?: boolean
  validateOnBlur?: boolean
  initialValues?: Partial<T>
}

interface UseFormValidationReturn<T> {
  values: Partial<T>
  errors: FormErrors
  isValid: boolean
  isValidating: boolean
  setValue: (field: keyof T, value: unknown) => void
  setValues: (values: Partial<T>) => void
  setFieldError: (field: keyof T, error: string) => void
  clearFieldError: (field: keyof T) => void
  clearErrors: () => void
  validate: () => ValidationResult<T>
  validateField: (field: keyof T) => boolean
  reset: () => void
  handleChange: (field: keyof T) => (value: unknown) => void
  handleBlur: (field: keyof T) => () => void
  getFieldError: (field: keyof T) => string[]
}

/**
 * Custom hook for form validation using Zod schemas
 */
export function useFormValidation<T extends Record<string, unknown>>({
  schema,
  validateOnChange = false,
  validateOnBlur = true,
  initialValues = {},
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValuesState] = useState<Partial<T>>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({
    formErrors: [],
    fieldErrors: {},
  })
  const [isValidating, setIsValidating] = useState(false)

  // Calculate if form is valid
  const isValid =
    errors.formErrors.length === 0 &&
    Object.keys(errors.fieldErrors).length === 0

  // Set a field error manually
  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: [error],
      },
    }))
  }, [])

  // Clear a field error
  const clearFieldError = useCallback((field: keyof T) => {
    setErrors(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: [],
      },
    }))
  }, [])

  // Validate a specific field
  const validateFieldInternal = useCallback(
    (field: keyof T) => {
      // Validate the whole form and extract field errors
      const result = validateFormData(schema, values)
      if (!result.success && result.errors?.fieldErrors[field as string]) {
        setFieldError(field, result.errors.fieldErrors[field as string][0])
        return false
      } else {
        clearFieldError(field)
        return true
      }
    },
    [schema, values, setFieldError, clearFieldError]
  )

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({ formErrors: [], fieldErrors: {} })
  }, [])

  // Validate the entire form
  const validate = useCallback((): ValidationResult<T> => {
    setIsValidating(true)

    const result = validateFormData(schema, values)

    if (result.success) {
      setErrors({ formErrors: [], fieldErrors: {} })
    } else if (result.errors) {
      setErrors(result.errors)
    }

    setIsValidating(false)
    return result
  }, [schema, values])

  // Set a single field value
  const setValue = useCallback(
    (field: keyof T, value: unknown) => {
      setValuesState(prev => ({ ...prev, [field]: value }))

      if (validateOnChange) {
        // Clear previous error for this field
        setErrors(prev => ({
          ...prev,
          fieldErrors: {
            ...prev.fieldErrors,
            [field]: [],
          },
        }))

        // Validate the specific field
        setTimeout(() => {
          validateFieldInternal(field)
        }, 0)
      }
    },
    [validateOnChange, validateFieldInternal]
  )

  // Set multiple field values
  const setValues = useCallback(
    (newValues: Partial<T>) => {
      setValuesState(prev => ({ ...prev, ...newValues }))

      if (validateOnChange) {
        setTimeout(() => {
          validate()
        }, 0)
      }
    },
    [validateOnChange, validate]
  )

  const validateFieldPublic = useCallback(
    (field: keyof T): boolean => {
      return validateFieldInternal(field)
    },
    [validateFieldInternal]
  )

  // Reset form to initial values
  const reset = useCallback(() => {
    setValuesState(initialValues)
    clearErrors()
  }, [initialValues, clearErrors])

  // Create change handler for a field
  const handleChange = useCallback(
    (field: keyof T) => {
      return (value: unknown) => {
        setValue(field, value)
      }
    },
    [setValue]
  )

  // Create blur handler for a field
  const handleBlur = useCallback(
    (field: keyof T) => {
      return () => {
        if (validateOnBlur) {
          validateFieldInternal(field)
        }
      }
    },
    [validateOnBlur, validateFieldInternal]
  )

  // Get errors for a specific field
  const getFieldError = useCallback(
    (field: keyof T): string[] => {
      return errors.fieldErrors[field as string] || []
    },
    [errors.fieldErrors]
  )

  // Auto-validate on mount if there are initial values
  useEffect(() => {
    if (Object.keys(initialValues).length > 0 && validateOnChange) {
      validate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- Only run once on mount

  return {
    values,
    errors,
    isValid,
    isValidating,
    setValue,
    setValues,
    setFieldError,
    clearFieldError,
    clearErrors,
    validate,
    validateField: validateFieldPublic,
    reset,
    handleChange,
    handleBlur,
    getFieldError,
  }
}
