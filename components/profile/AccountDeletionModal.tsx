'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { HiExclamationCircle } from 'react-icons/hi'
import { deleteAccountAction } from '@/lib/actions/user-actions'
import { Button } from '@/components/interactive/Button'
import { FormInput } from '@/components/forms/FormInput'
import { Icon } from '@/components/interactive/Icon'
import { Modal } from '@/components/interactive/Modal'

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size='lg'
      closeOnBackdropClick={!isDeleting}
      closeOnEscape={!isDeleting}
    >
      <Modal.Header>
        <div className='flex items-center'>
          <div className='mr-4 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-error-100'>
            <Icon icon={HiExclamationCircle} size='xl' color='error' />
          </div>
          <div>Delete Account</div>
        </div>
      </Modal.Header>

      <Modal.Body>
        <div className='mb-4'>
          <p className='text-sm text-neutral-500'>
            This action cannot be undone. This will permanently delete your
            account and all associated data.
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
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
              Type <span className='font-bold text-error-600'>DELETE</span> to
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
        </form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          type='button'
          onClick={handleClose}
          disabled={isDeleting}
          variant='secondary'
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isDeleting || !password || confirmText !== 'DELETE'}
          variant='danger'
        >
          {isDeleting ? 'Deleting...' : 'Delete Account'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
