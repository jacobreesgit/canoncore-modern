'use client'

import React, { useActionState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FormError } from './FormError'
import { ValidationErrorDisplay } from './ValidationErrorDisplay'
import { useActionResult } from '@/lib/actions/validated-actions'
import type { FormErrors } from '@/lib/errors'

interface ValidatedFormProps
  extends Omit<
    React.FormHTMLAttributes<HTMLFormElement>,
    'action' | 'onError'
  > {
  action: (
    formData: FormData
  ) => Promise<{ success: boolean; errors?: FormErrors; message?: string }>
  children: React.ReactNode
  className?: string
  showGlobalErrors?: boolean
  resetOnSuccess?: boolean
  onSuccess?: (data?: unknown) => void
  onError?: (errors: FormErrors) => void
}

/**
 * Form component with built-in validation error display
 */
export function ValidatedForm({
  action,
  children,
  className,
  showGlobalErrors = true,
  resetOnSuccess = false,
  onSuccess,
  onError,
  ...props
}: ValidatedFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (
      prevState:
        | { success: boolean; errors?: FormErrors; message?: string }
        | undefined,
      formData: FormData
    ) => {
      return await action(formData)
    },
    undefined
  )
  const result = useActionResult(state)

  // Handle success/error callbacks
  useEffect(() => {
    if (result.isSuccess && onSuccess) {
      onSuccess(result.data)
    }

    if (result.isError && result.errors && onError) {
      onError(result.errors)
    }
  }, [
    result.isSuccess,
    result.isError,
    result.data,
    result.errors,
    onSuccess,
    onError,
  ])

  // Reset form on success if requested
  useEffect(() => {
    if (result.isSuccess && resetOnSuccess) {
      const form = document.querySelector('form') as HTMLFormElement
      if (form) {
        form.reset()
      }
    }
  }, [result.isSuccess, resetOnSuccess])

  return (
    <div className='validated-form-container'>
      {/* Global success message */}
      {result.isSuccess && result.message && (
        <div className='mb-4 bg-green-50 border border-green-200 rounded-lg p-4'>
          <div className='flex items-center gap-2'>
            <svg
              className='w-5 h-5 text-green-600'
              fill='currentColor'
              viewBox='0 0 20 20'
              role='img'
              aria-label='Success'
            >
              <path
                fillRule='evenodd'
                d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                clipRule='evenodd'
              />
            </svg>
            <span className='text-sm font-medium text-green-800'>
              {result.message}
            </span>
          </div>
        </div>
      )}

      {/* Global error display */}
      {showGlobalErrors && result.isError && result.errors && (
        <div className='mb-4'>
          <ValidationErrorDisplay errors={result.errors} />
        </div>
      )}

      <form
        action={formAction}
        className={cn('validated-form', className)}
        noValidate
        {...props}
      >
        <FormProvider
          isPending={isPending}
          errors={result.fieldErrors}
          getFieldError={result.getFieldError}
          hasFieldError={result.hasFieldError}
        >
          {children}
        </FormProvider>

        {/* Loading state overlay */}
        {isPending && (
          <div className='absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center rounded-lg'>
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent'></div>
              <span className='text-sm text-gray-600'>Processing...</span>
            </div>
          </div>
        )}
      </form>
    </div>
  )
}

/**
 * Context for form validation state
 */
interface FormContextValue {
  isPending: boolean
  errors: Record<string, string[]>
  getFieldError: (field: string) => string[]
  hasFieldError: (field: string) => boolean
}

const FormContext = React.createContext<FormContextValue | null>(null)

/**
 * Provider for form validation context
 */
function FormProvider({
  children,
  isPending,
  errors,
  getFieldError,
  hasFieldError,
}: {
  children: React.ReactNode
  isPending: boolean
  errors: Record<string, string[]>
  getFieldError: (field: string) => string[]
  hasFieldError: (field: string) => boolean
}) {
  const value = React.useMemo(
    () => ({
      isPending,
      errors,
      getFieldError,
      hasFieldError,
    }),
    [isPending, errors, getFieldError, hasFieldError]
  )

  return <FormContext.Provider value={value}>{children}</FormContext.Provider>
}

/**
 * Hook to access form validation context
 */
export function useFormContext() {
  const context = React.useContext(FormContext)
  if (!context) {
    throw new Error('useFormContext must be used within a ValidatedForm')
  }
  return context
}

/**
 * Form field wrapper with automatic error display
 */
interface FormFieldProps {
  name: string
  label?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  name,
  label,
  required,
  children,
  className,
}: FormFieldProps) {
  const { getFieldError, hasFieldError, isPending } = useFormContext()
  const fieldErrors = getFieldError(name)
  const hasError = hasFieldError(name)

  return (
    <div className={cn('form-field', className)}>
      {label && (
        <label
          htmlFor={name}
          className={cn(
            'block text-sm font-medium mb-1',
            hasError ? 'text-red-700' : 'text-gray-700',
            required && 'after:content-["*"] after:ml-0.5 after:text-red-500'
          )}
        >
          {label}
        </label>
      )}

      <div
        className={cn(
          'form-field-input',
          isPending && 'opacity-50 pointer-events-none'
        )}
      >
        {children}
      </div>

      <FormError error={fieldErrors} />
    </div>
  )
}

export default ValidatedForm
