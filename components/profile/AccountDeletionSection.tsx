'use client'

import { useState } from 'react'
import { AccountDeletionModal } from './AccountDeletionModal'
import { Button } from '@/components/interactive/Button'

/**
 * Account Deletion Section Component
 *
 * Dangerous action section for deleting user account
 * Includes warnings and confirmation flow
 */
export function AccountDeletionSection() {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className='rounded-lg border border-error-200 bg-error-50 p-6'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-error-900'>Danger Zone</h3>
          <p className='text-sm text-error-700 mt-1'>
            Actions in this section are irreversible and will permanently delete
            your account.
          </p>
        </div>

        <div className='space-y-4'>
          <div>
            <h4 className='text-sm font-medium text-error-900'>
              Delete Account
            </h4>
            <p className='text-sm text-error-700 mt-1'>
              Once you delete your account, there is no going back. This will
              permanently delete:
            </p>
            <ul className='text-sm text-error-700 mt-2 list-disc list-inside space-y-1'>
              <li>Your profile and account information</li>
              <li>All universes you&apos;ve created</li>
              <li>All content within your universes</li>
              <li>Your progress tracking data</li>
              <li>Your favorites and bookmarks</li>
            </ul>
          </div>

          <Button onClick={() => setShowModal(true)} variant='danger'>
            Delete Account
          </Button>
        </div>
      </div>

      <AccountDeletionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
