'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Content } from '@/lib/types'
import {
  updateContentAction,
  deleteContentAction,
  ContentActionResult,
} from '@/lib/actions/content-actions'
import { FormField } from '@/components/forms/FormField'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormActions } from '@/components/forms/FormActions'
import { FormError } from '@/components/forms/FormError'

const viewableMediaTypes = [
  { value: 'video', label: 'Movies & Episodes' },
  { value: 'audio', label: 'Audio Content' },
  { value: 'text', label: 'Books & Comics' },
]

const organizationalTypes = [
  { value: 'series', label: 'Series & Collections' },
  { value: 'phase', label: 'Phases & Arcs' },
  { value: 'character', label: 'Characters & People' },
  { value: 'location', label: 'Locations & Settings' },
  { value: 'other', label: 'Other Organization' },
]

interface EditContentClientProps {
  content: Content
}

/**
 * Edit Content Client Component
 */
export function EditContentClient({ content }: EditContentClientProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // React 19: useActionState for form management
  const [state, formAction, isPending] = useActionState(
    async (prevState: ContentActionResult | null, formData: FormData) => {
      return updateContentAction(content.id, formData)
    },
    null
  )

  // Delete action state
  const [deleteState, deleteAction, isDeleting] = useActionState(async () => {
    return deleteContentAction(content.id)
  }, null)

  // Handle successful update
  useEffect(() => {
    if (state?.success) {
      router.push(`/universes/${content.universeId}`)
    }
  }, [state, router, content.universeId])

  // Note: No need to handle successful deletion redirect since server action handles it

  const typeOptions = content.isViewable
    ? viewableMediaTypes
    : organizationalTypes
  const currentType = content.mediaType || 'other'

  return (
    <div className='bg-white rounded-lg shadow-sm'>
      <form action={formAction} className='p-6 space-y-6'>
        <FormError error={state?.error} />

        <FormField label='Content Name' required>
          <FormInput
            name='name'
            defaultValue={content.name}
            placeholder='Content name...'
            disabled={isPending}
            required
          />
        </FormField>

        <FormField label='Description'>
          <FormTextarea
            name='description'
            defaultValue={content.description || ''}
            placeholder='Brief description...'
            rows={3}
            disabled={isPending}
          />
        </FormField>

        <FormField
          label={content.isViewable ? 'Media Type' : 'Organization Type'}
          required
        >
          <FormSelect
            name='mediaType'
            defaultValue={currentType}
            disabled={isPending}
            required
          >
            {typeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </FormSelect>
          <p className='text-sm text-gray-600 mt-1'>
            {content.isViewable
              ? 'The type of viewable content'
              : 'How this content organizes your universe'}
          </p>
        </FormField>

        <div className='bg-gray-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-gray-900 mb-2'>
            Content Type
          </h4>
          <p className='text-sm text-gray-600'>
            {content.isViewable ? 'Viewable Content' : 'Organizational Content'}{' '}
            - This cannot be changed after creation.
          </p>
        </div>

        <FormActions
          submitLabel='Update Content'
          cancelHref={`/universes/${content.universeId}`}
          isSubmitting={isPending}
        />
      </form>

      {/* Delete Section */}
      <div className='border-t border-gray-200 p-6'>
        <div className='bg-red-50 rounded-lg p-4'>
          <h4 className='text-sm font-medium text-red-800 mb-2'>
            Delete Content
          </h4>
          <p className='text-sm text-red-600 mb-4'>
            This action cannot be undone. This will permanently delete the
            content and remove all associated relationships.
          </p>

          {deleteState?.error && (
            <div className='mb-4 p-3 bg-red-100 border border-red-200 rounded text-sm text-red-600'>
              {deleteState.error}
            </div>
          )}

          {!showDeleteConfirm ? (
            <button
              type='button'
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending || isDeleting}
              className='inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
            >
              Delete Content
            </button>
          ) : (
            <div className='space-y-3'>
              <p className='text-sm font-medium text-red-800'>
                Are you sure you want to delete &quot;{content.name}&quot;?
              </p>
              <div className='flex space-x-3'>
                <form action={deleteAction}>
                  <button
                    type='submit'
                    disabled={isPending || isDeleting}
                    className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                </form>
                <button
                  type='button'
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isPending || isDeleting}
                  className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50'
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
