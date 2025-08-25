'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { deleteAccountAction } from '@/lib/actions/user-actions'

interface AccountDeletionModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * Account Deletion Modal Component
 *
 * Modal for confirming account deletion with password verification
 * Handles the complete deletion flow including signout and redirect
 */
export function AccountDeletionModal({
  isOpen,
  onClose,
}: AccountDeletionModalProps) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsDeleting(true)
    setError(null)

    try {
      // Verify the confirmation text
      if (confirmText !== 'DELETE') {
        throw new Error('Please type DELETE to confirm')
      }

      if (!password.trim()) {
        throw new Error('Password is required to confirm deletion')
      }

      // Create form data for the server action
      const formData = new FormData()
      formData.append('password', password)
      formData.append('confirmText', confirmText)

      // Call the enhanced delete account action
      const result = await deleteAccountAction(formData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete account')
      }

      // Sign out from NextAuth (clears all sessions)
      await signOut({
        redirect: false, // We'll handle redirect manually
      })

      // Redirect to homepage with success message
      router.push('/?deleted=true')
    } catch (error) {
      console.error('Error deleting account:', error)
      setError(
        error instanceof Error ? error.message : 'Failed to delete account'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setPassword('')
      setConfirmText('')
      setError(null)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-full items-center justify-center p-4 text-center'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black bg-opacity-50 transition-opacity'
          onClick={handleClose}
        />

        {/* Modal */}
        <div className='relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6'>
          <div className='sm:flex sm:items-start'>
            <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10'>
              <svg
                className='h-6 w-6 text-red-600'
                fill='none'
                viewBox='0 0 24 24'
                strokeWidth='1.5'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  d='M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z'
                />
              </svg>
            </div>
            <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full'>
              <h3 className='text-base font-semibold leading-6 text-gray-900'>
                Delete Account
              </h3>
              <div className='mt-2'>
                <p className='text-sm text-gray-500'>
                  This action cannot be undone. This will permanently delete
                  your account and all associated data.
                </p>
              </div>

              <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
                {/* Password Confirmation */}
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Enter your password to confirm
                  </label>
                  <input
                    type='password'
                    id='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500'
                    placeholder='Your current password'
                    disabled={isDeleting}
                    required
                  />
                </div>

                {/* Confirmation Text */}
                <div>
                  <label
                    htmlFor='confirmText'
                    className='block text-sm font-medium text-gray-700'
                  >
                    Type <span className='font-bold text-red-600'>DELETE</span>{' '}
                    to confirm
                  </label>
                  <input
                    type='text'
                    id='confirmText'
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    className='mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500'
                    placeholder='DELETE'
                    disabled={isDeleting}
                    required
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className='rounded-md bg-red-50 p-3'>
                    <div className='text-sm text-red-700'>{error}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                  <button
                    type='submit'
                    disabled={
                      isDeleting || !password || confirmText !== 'DELETE'
                    }
                    className='inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-50 sm:ml-3 sm:w-auto'
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </button>
                  <button
                    type='button'
                    onClick={handleClose}
                    disabled={isDeleting}
                    className='mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0 sm:w-auto'
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
