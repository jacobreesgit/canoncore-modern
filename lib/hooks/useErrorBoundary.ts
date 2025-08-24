'use client'

import { useCallback } from 'react'

/**
 * Hook for manually triggering error boundaries
 * Useful for async operations that need to trigger error boundaries
 */
export function useErrorBoundary() {
  const throwError = useCallback((error: unknown) => {
    // Use setTimeout to ensure the error is thrown outside of React's error handling
    setTimeout(() => {
      if (error instanceof Error) {
        throw error
      } else {
        throw new Error(String(error))
      }
    }, 0)
  }, [])

  return { throwError }
}
