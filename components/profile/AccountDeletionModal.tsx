'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { HiExclamationCircle } from 'react-icons/hi'
import { deleteAccountAction } from '@/lib/actions/user-actions'
import { Button } from '@/components/interactive/Button'
import { FormInput } from '@/components/forms/FormInput'

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
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting account:', error)
      }
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
            <div className='mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error-100 sm:mx-0 sm:h-10 sm:w-10'>
              <HiExclamationCircle className='h-6 w-6 text-error-600' />
            </div>
            <div className='mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full'>
              <h3 className='text-lg font-medium leading-6 text-neutral-900'>
                Delete Account
              </h3>
              <div className='mt-2'>
                <p className='text-sm text-neutral-500'>
                  This action cannot be undone. This will permanently delete
                  your account and all associated data.
                </p>
              </div>

              <form onSubmit={handleSubmit} className='mt-4 space-y-4'>
                {/* Password Confirmation */}
                <div>
                  <label
                    htmlFor='password'
                    className='block text-sm font-medium text-neutral-700'
                  >
                    Enter your password to confirm
                  </label>
                  <FormInput
                    type='password'
                    id='password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    variant='error'
                    className='mt-1 focus-visible:border-error-500 focus-visible:ring-error-500'
                    placeholder='Enter your current password'
                    disabled={isDeleting}
                    required
                  />
                </div>

                {/* Confirmation Text */}
                <div>
                  <label
                    htmlFor='confirmText'
                    className='block text-sm font-medium text-neutral-700'
                  >
                    Type{' '}
                    <span className='font-bold text-error-600'>DELETE</span> to
                    confirm
                  </label>
                  <FormInput
                    type='text'
                    id='confirmText'
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    variant='error'
                    className='mt-1 focus-visible:border-error-500 focus-visible:ring-error-500'
                    placeholder='DELETE'
                    disabled={isDeleting}
                    required
                  />
                </div>

                {/* Error Display */}
                {error && (
                  <div className='rounded-md bg-error-50 p-3'>
                    <div className='text-sm text-error-700'>{error}</div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className='mt-5 sm:mt-4 sm:flex sm:flex-row-reverse'>
                  <Button
                    type='submit'
                    disabled={
                      isDeleting || !password || confirmText !== 'DELETE'
                    }
                    variant='danger'
                    className='inline-flex w-full justify-center sm:ml-3 sm:w-auto'
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                  <Button
                    type='button'
                    onClick={handleClose}
                    disabled={isDeleting}
                    variant='danger'
                    className='mt-3 inline-flex w-full justify-center sm:mt-0 sm:w-auto'
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
