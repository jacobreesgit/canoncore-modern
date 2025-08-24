'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createUniverseAction,
  UniverseActionResult,
} from '@/lib/actions/universe-actions'
import { FormField } from '@/components/forms/FormField'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormURLInput } from '@/components/forms/FormURLInput'
import { FormActions } from '@/components/forms/FormActions'
import { FormError } from '@/components/forms/FormError'

/**
 * Create Universe Client Component
 * React 19 optimized form using useActionState and server actions
 */
export function CreateUniverseClient() {
  const router = useRouter()
  const [hasSourceURL, setHasSourceURL] = useState(false)

  // React 19: useActionState for form management
  const [state, formAction, isPending] = useActionState(
    async (prevState: UniverseActionResult | null, formData: FormData) => {
      return createUniverseAction(formData)
    },
    null
  )

  // Handle successful creation
  useEffect(() => {
    if (state?.success && state.universeId) {
      router.push(`/universes/${state.universeId}`)
    }
  }, [state, router])

  return (
    <div className='bg-white rounded-lg shadow-sm'>
      <form action={formAction} className='p-6 space-y-6'>
        <FormError error={state?.error} />

        <FormField label='Universe Name' required>
          <FormInput
            name='name'
            placeholder='e.g., Marvel Cinematic Universe'
            disabled={isPending}
            required
          />
        </FormField>

        <FormField label='Description'>
          <FormTextarea
            name='description'
            placeholder='Brief description of this franchise universe...'
            rows={3}
            disabled={isPending}
          />
        </FormField>

        <FormField>
          <label className='flex items-center'>
            <input
              type='checkbox'
              name='isPublic'
              value='true'
              defaultChecked
              disabled={isPending}
              className='rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500'
            />
            <span className='ml-2 text-sm text-gray-700'>
              Make this universe publicly discoverable
            </span>
          </label>
        </FormField>

        <div className='border-t pt-6'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-lg font-medium text-gray-900'>
              Source Information
            </h3>
            <button
              type='button'
              onClick={() => setHasSourceURL(!hasSourceURL)}
              className='text-sm text-blue-600 hover:text-blue-700'
            >
              {hasSourceURL ? 'Remove source link' : 'Add source link'}
            </button>
          </div>

          {hasSourceURL && (
            <div className='space-y-4'>
              <FormField label='Source URL'>
                <FormURLInput
                  name='sourceLink'
                  placeholder='https://en.wikipedia.org/wiki/Marvel_Cinematic_Universe'
                  disabled={isPending}
                />
              </FormField>

              <FormField label='Source Name'>
                <FormInput
                  name='sourceLinkName'
                  placeholder='e.g., Wikipedia'
                  disabled={isPending}
                />
              </FormField>
            </div>
          )}
        </div>

        <FormActions
          submitLabel='Create Universe'
          cancelHref='/'
          isSubmitting={isPending}
        />
      </form>
    </div>
  )
}
