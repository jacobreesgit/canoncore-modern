'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { HiCheckCircle } from 'react-icons/hi'
import { Button } from '@/components/interactive/Button'
import { Icon } from '@/components/interactive/Icon'

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
    <div className='mb-6 rounded-lg border border-success-200 bg-success-50 p-4'>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <Icon icon={HiCheckCircle} size='lg' color='success' />
        </div>
        <div className='ml-3'>
          <h3 className='text-sm font-medium text-success-800'>
            Account Successfully Deleted
          </h3>
          <p className='mt-1 text-sm text-success-700'>
            Your account and all associated data have been permanently deleted.
            Thank you for using CanonCore.
          </p>
          <div className='mt-2'>
            <Button
              onClick={() => setShow(false)}
              variant='clear'
              size='small'
              className='text-sm font-medium text-success-800 underline hover:text-success-600'
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
