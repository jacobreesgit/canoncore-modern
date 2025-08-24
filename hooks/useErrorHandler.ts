'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  isRouteErrorResponse,
  getErrorMessage,
  getHttpErrorMessage,
} from '@/lib/errors'
import { errorTracker } from '@/lib/errors'

interface UseErrorHandlerOptions {
  onError?: (error: unknown, context?: Record<string, unknown>) => void
  redirectOnUnauthorized?: boolean
  showToast?: boolean
}

interface UseErrorHandlerReturn {
  handleError: (error: unknown, context?: Record<string, unknown>) => void
  handleAsyncError: (
    errorPromise: Promise<unknown>,
    context?: Record<string, unknown>
  ) => Promise<void>
  handleApiError: (
    response: Response,
    context?: Record<string, unknown>
  ) => Promise<void>
  formatError: (error: unknown) => string
}

/**
 * Custom hook for centralized error handling
 */
export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const router = useRouter()
  const { onError, redirectOnUnauthorized = true, showToast = true } = options

  const formatError = useCallback((error: unknown): string => {
    if (isRouteErrorResponse(error)) {
      return getHttpErrorMessage(error.status)
    }

    return getErrorMessage(error)
  }, [])

  const handleError = useCallback(
    (error: unknown, context: Record<string, unknown> = {}) => {
      // Track the error
      errorTracker.trackError(error, context)

      // Handle specific error types
      if (isRouteErrorResponse(error)) {
        if (error.status === 401 && redirectOnUnauthorized) {
          router.push('/login')
          return
        }

        if (error.status === 403) {
          router.push('/unauthorized')
          return
        }
      }

      // Show user-friendly error message
      if (showToast) {
        const message = formatError(error)
        // You can integrate with your toast library here
        console.error('Error:', message)
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error, context)
      }
    },
    [router, redirectOnUnauthorized, showToast, onError, formatError]
  )

  const handleAsyncError = useCallback(
    async (
      errorPromise: Promise<unknown>,
      context: Record<string, unknown> = {}
    ) => {
      try {
        await errorPromise
      } catch (error) {
        handleError(error, context)
      }
    },
    [handleError]
  )

  const handleApiError = useCallback(
    async (response: Response, context: Record<string, unknown> = {}) => {
      if (!response.ok) {
        let errorData: unknown

        try {
          errorData = await response.json()
        } catch {
          errorData = await response.text()
        }

        const error = new Error(getHttpErrorMessage(response.status))
        error.name = 'APIError'

        handleError(error, {
          ...context,
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          data: errorData,
        })
      }
    },
    [handleError]
  )

  return {
    handleError,
    handleAsyncError,
    handleApiError,
    formatError,
  }
}

/**
 * Hook for handling form submission errors
 */
export function useFormErrorHandler() {
  const { formatError } = useErrorHandler({
    showToast: false, // Forms typically show errors inline
  })

  const handleSubmissionError = useCallback(
    (error: unknown) => {
      // Track form-specific errors
      errorTracker.trackUserActionError('form_submission', error)

      return formatError(error)
    },
    [formatError]
  )

  return {
    handleSubmissionError,
    formatError,
  }
}

/**
 * Hook for handling API request errors
 */
export function useApiErrorHandler() {
  const { handleApiError, handleAsyncError } = useErrorHandler()

  const handleFetchError = useCallback(
    async (
      fetchPromise: Promise<Response>,
      context?: Record<string, unknown>
    ) => {
      try {
        const response = await fetchPromise
        if (!response.ok) {
          await handleApiError(response, context)
        }
        return response
      } catch (error) {
        await handleAsyncError(Promise.reject(error), {
          ...context,
          type: 'network_error',
        })
        throw error
      }
    },
    [handleApiError, handleAsyncError]
  )

  return {
    handleFetchError,
    handleApiError,
  }
}
