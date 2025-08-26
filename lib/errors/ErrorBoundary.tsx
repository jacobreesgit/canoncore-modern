'use client'

import { HiExclamationCircle, HiQuestionMarkCircle } from 'react-icons/hi'
import { Button } from '@/components/interactive/Button'

function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

function sanitizeError(error: unknown): void {
  // Only log in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error caught by ErrorBoundary:', error)
  }
}

interface ErrorBoundaryProps {
  error?: unknown
}

/**
 * Global Error Boundary Component
 * Handles different types of errors with user-friendly messages
 */
export function ErrorBoundary({ error }: ErrorBoundaryProps = {}) {
  const actualError = error

  // Sanitize error for production
  sanitizeError(actualError)

  // Handle general errors
  if (actualError instanceof Error) {
    const isDevelopment = process.env.NODE_ENV === 'development'

    return (
      <div className='min-h-screen flex items-center justify-center bg-surface'>
        <div className='max-w-2xl w-full bg-white shadow-lg rounded-lg p-6'>
          <div className='flex items-center justify-center w-12 h-12 mx-auto bg-error-100 rounded-full'>
            <HiExclamationCircle className='w-6 h-6 text-error-600' />
          </div>

          <div className='mt-4 text-center'>
            <h1 className='text-2xl font-bold text-neutral-900 sm:text-3xl'>
              Oops! Something went wrong
            </h1>
            <p className='mt-2 text-neutral-600'>
              {getErrorMessage(actualError)}
            </p>
          </div>

          {isDevelopment && actualError.stack && (
            <div className='mt-6'>
              <h2 className='text-xl font-semibold text-neutral-900 mb-2'>
                Error Details (Development Only)
              </h2>
              <pre className='bg-neutral-100 p-4 rounded-md text-sm overflow-auto max-h-64 text-neutral-800'>
                {actualError.stack}
              </pre>
            </div>
          )}

          <div className='mt-6 flex flex-col sm:flex-row gap-3'>
            <Button
              onClick={() => window.location.reload()}
              variant='primary'
              className='flex-1'
            >
              Reload Page
            </Button>
            <Button
              onClick={() => (window.location.href = '/')}
              variant='secondary'
              className='flex-1'
            >
              Go Home
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Handle unknown error types
  return (
    <div className='min-h-screen flex items-center justify-center bg-surface'>
      <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6'>
        <div className='flex items-center justify-center w-12 h-12 mx-auto bg-warning-100 rounded-full'>
          <HiQuestionMarkCircle className='w-6 h-6 text-warning-600' />
        </div>

        <div className='mt-4 text-center'>
          <h1 className='text-2xl font-bold text-neutral-900 sm:text-3xl'>
            Unknown Error
          </h1>
          <p className='mt-2 text-neutral-600'>
            Something went wrong. Please try again.
          </p>
        </div>

        <div className='mt-6 flex flex-col sm:flex-row gap-3'>
          <Button
            onClick={() => window.location.reload()}
            variant='primary'
            className='flex-1'
          >
            Reload Page
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            variant='secondary'
            className='flex-1'
          >
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
