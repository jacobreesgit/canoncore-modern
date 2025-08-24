'use client'

import { getErrorMessage, sanitizeError } from './error-utils'
import { ERROR_MESSAGES } from './error-messages'

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
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='max-w-2xl w-full bg-white shadow-lg rounded-lg p-6'>
          <div className='flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full'>
            <svg
              className='w-6 h-6 text-red-600'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>

          <div className='mt-4 text-center'>
            <h1 className='text-2xl font-bold text-gray-900'>
              Oops! Something went wrong
            </h1>
            <p className='mt-2 text-gray-600'>{getErrorMessage(actualError)}</p>
          </div>

          {isDevelopment && actualError.stack && (
            <div className='mt-6'>
              <h2 className='text-lg font-semibold text-gray-900 mb-2'>
                Error Details (Development Only)
              </h2>
              <pre className='bg-gray-100 p-4 rounded-md text-sm overflow-auto max-h-64 text-gray-800'>
                {actualError.stack}
              </pre>
            </div>
          )}

          <div className='mt-6 flex flex-col sm:flex-row gap-3'>
            <button
              onClick={() => window.location.reload()}
              className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
            >
              Reload Page
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className='flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Handle unknown error types
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='max-w-md w-full bg-white shadow-lg rounded-lg p-6'>
        <div className='flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full'>
          <svg
            className='w-6 h-6 text-yellow-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
        </div>

        <div className='mt-4 text-center'>
          <h1 className='text-2xl font-bold text-gray-900'>Unknown Error</h1>
          <p className='mt-2 text-gray-600'>{ERROR_MESSAGES.UNKNOWN_ERROR}</p>
        </div>

        <div className='mt-6 flex flex-col sm:flex-row gap-3'>
          <button
            onClick={() => window.location.reload()}
            className='flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
          >
            Reload Page
          </button>
          <button
            onClick={() => (window.location.href = '/')}
            className='flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors'
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
