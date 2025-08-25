'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/db/schema'
import { updateProfileAction } from '@/lib/actions/user-actions'

interface ProfileEditFormProps {
  user: User
}

/**
 * Profile Edit Form Component
 *
 * Form for editing user profile information using Server Actions
 * Includes validation and error handling with useActionState
 */
export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    undefined
  )

  // Redirect on successful update
  useEffect(() => {
    if (state?.success) {
      router.push(`/profile/${user.id}`)
    }
  }, [state?.success, router, user.id])

  const handleCancel = () => {
    router.push(`/profile/${user.id}`)
  }

  return (
    <form action={formAction} className='space-y-6'>
      {/* Success Message */}
      {state?.success && state?.message && (
        <div className='rounded-md bg-green-50 p-4'>
          <div className='text-sm text-green-700'>{state.message}</div>
        </div>
      )}

      {/* General Error Message */}
      {state?.message && !state?.success && !state?.errors && (
        <div className='rounded-md bg-red-50 p-4'>
          <div className='text-sm text-red-700'>{state.message}</div>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700'
        >
          Display Name
        </label>
        <input
          type='text'
          id='name'
          name='name'
          defaultValue={user.name || ''}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            state?.errors?.name
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder='Enter your display name'
          disabled={pending}
        />
        {state?.errors?.name && (
          <div className='mt-1 space-y-1'>
            {state.errors.name.map((error, index) => (
              <p key={index} className='text-sm text-red-600'>
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Email Field */}
      <div>
        <label
          htmlFor='email'
          className='block text-sm font-medium text-gray-700'
        >
          Email Address
        </label>
        <input
          type='email'
          id='email'
          name='email'
          defaultValue={user.email}
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            state?.errors?.email
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder='Enter your email address'
          disabled={pending}
        />
        {state?.errors?.email && (
          <div className='mt-1 space-y-1'>
            {state.errors.email.map((error, index) => (
              <p key={index} className='text-sm text-red-600'>
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className='flex justify-end gap-4'>
        <button
          type='button'
          onClick={handleCancel}
          className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50'
          disabled={pending}
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={pending}
          className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {pending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
