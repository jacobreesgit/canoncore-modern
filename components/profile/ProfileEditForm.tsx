'use client'

import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@/lib/db/schema'

interface ProfileEditFormProps {
  user: User
}

interface ProfileFormData {
  name: string
  email: string
}

/**
 * Profile Edit Form Component
 *
 * Form for editing user profile information using React Hook Form
 * Includes validation and error handling
 */
export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user.name || '',
      email: user.email,
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      // Redirect back to profile page
      router.push(`/profile/${user.id}`)
      router.refresh() // Refresh server components
    } catch (error) {
      console.error('Error updating profile:', error)
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update profile'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push(`/profile/${user.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Name Field */}
      <div>
        <label
          htmlFor='name'
          className='block text-sm font-medium text-gray-700'
        >
          Display Name
        </label>
        <input
          {...register('name', {
            required: 'Display name is required',
            minLength: {
              value: 2,
              message: 'Display name must be at least 2 characters',
            },
            maxLength: {
              value: 50,
              message: 'Display name must be less than 50 characters',
            },
          })}
          type='text'
          id='name'
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder='Enter your display name'
        />
        {errors.name && (
          <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>
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
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address',
            },
          })}
          type='email'
          id='email'
          className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.email
              ? 'border-red-300 focus:border-red-500'
              : 'border-gray-300 focus:border-blue-500'
          }`}
          placeholder='Enter your email address'
        />
        {errors.email && (
          <p className='mt-1 text-sm text-red-600'>{errors.email.message}</p>
        )}
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className='rounded-md bg-red-50 p-4'>
          <div className='text-sm text-red-700'>{submitError}</div>
        </div>
      )}

      {/* Form Actions */}
      <div className='flex justify-end gap-4'>
        <button
          type='button'
          onClick={handleCancel}
          className='rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50'
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={isSubmitting || !isDirty}
          className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
