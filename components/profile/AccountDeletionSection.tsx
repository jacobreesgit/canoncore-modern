'use client'

import { useState } from 'react'
import { AccountDeletionModal } from './AccountDeletionModal'

interface AccountDeletionSectionProps {
  userId: string
}

/**
 * Account Deletion Section Component
 *
 * Dangerous action section for deleting user account
 * Includes warnings and confirmation flow
 */
export function AccountDeletionSection({ userId }: AccountDeletionSectionProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className='rounded-lg border border-red-200 bg-red-50 p-6'>
        <div className='mb-4'>
          <h3 className='text-lg font-semibold text-red-900'>Danger Zone</h3>
          <p className='text-sm text-red-700 mt-1'>
            Actions in this section are irreversible and will permanently delete your account.
          </p>
        </div>

        <div className='space-y-4'>
          <div>
            <h4 className='font-medium text-red-900'>Delete Account</h4>
            <p className='text-sm text-red-700 mt-1'>
              Once you delete your account, there is no going back. This will permanently delete:
            </p>
            <ul className='text-sm text-red-700 mt-2 list-disc list-inside space-y-1'>
              <li>Your profile and account information</li>
              <li>All universes you've created</li>
              <li>All content within your universes</li>
              <li>Your progress tracking data</li>
              <li>Your favorites and bookmarks</li>
            </ul>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className='rounded-lg bg-red-600 px-4 py-2 text-white font-medium transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
          >
            Delete Account
          </button>
        </div>
      </div>

      <AccountDeletionModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userId={userId}
      />
    </>
  )
}