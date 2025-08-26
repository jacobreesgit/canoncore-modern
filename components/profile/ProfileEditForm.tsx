'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/db/schema'
import { updateProfileAction } from '@/lib/actions/user-actions'
import { Button } from '@/components/interactive/Button'
import { FormInput } from '@/components/forms/FormInput'

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
        <div className='rounded-md bg-success-50 p-4'>
          <div className='text-sm text-success-700'>{state.message}</div>
        </div>
      )}

      {/* General Error Message */}
      {state?.message && !state?.success && !state?.errors && (
        <div className='rounded-md bg-error-50 p-4'>
          <div className='text-sm text-error-700'>{state.message}</div>
        </div>
      )}

      {/* Name Field */}
      <div>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-neutral-700'
        >
          Display Name
        </label>
        <FormInput
          type='text'
          id='name'
          name='name'
          defaultValue={user.name || ''}
          variant={state?.errors?.name ? 'error' : 'default'}
          className='mt-1'
          placeholder='Enter your display name'
          disabled={pending}
        />
        {state?.errors?.name && (
          <div className='mt-1 space-y-1'>
            {state.errors.name.map((error, index) => (
              <p key={index} className='text-sm text-error-600'>
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
          className='block text-sm font-medium text-neutral-700'
        >
          Email Address
        </label>
        <FormInput
          type='email'
          id='email'
          name='email'
          defaultValue={user.email}
          variant={state?.errors?.email ? 'error' : 'default'}
          className='mt-1'
          placeholder='Enter your email address'
          disabled={pending}
        />
        {state?.errors?.email && (
          <div className='mt-1 space-y-1'>
            {state.errors.email.map((error, index) => (
              <p key={index} className='text-sm text-error-600'>
                {error}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className='flex justify-end gap-4'>
        <Button
          type='button'
          onClick={handleCancel}
          variant='danger'
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type='submit' disabled={pending} variant='primary'>
          {pending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
