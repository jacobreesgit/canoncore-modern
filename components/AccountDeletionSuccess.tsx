'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

/**
 * Account Deletion Success Component
 *
 * Shows a success message when user account is successfully deleted
 * Displays on homepage with ?deleted=true query parameter
 */
export function AccountDeletionSuccess() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (searchParams.get('deleted') === 'true') {
      setShow(true)
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShow(false)
      }, 10000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  if (!show) return null

  return (
    <div className='mb-6 rounded-lg border border-green-200 bg-green-50 p-4'>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <svg
            className='h-5 w-5 text-green-400'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
              clipRule='evenodd'
            />
          </svg>
        </div>
        <div className='ml-3'>
          <h3 className='text-sm font-medium text-green-800'>
            Account Successfully Deleted
          </h3>
          <p className='mt-1 text-sm text-green-700'>
            Your account and all associated data have been permanently deleted.
            Thank you for using CanonCore.
          </p>
          <div className='mt-2'>
            <button
              onClick={() => setShow(false)}
              className='text-sm font-medium text-green-800 underline hover:text-green-600'
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
