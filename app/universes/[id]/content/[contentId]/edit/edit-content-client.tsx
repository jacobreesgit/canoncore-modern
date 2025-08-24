'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Content } from '@/lib/types'
import {
  updateContentAction,
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

  // React 19: useActionState for form management
  const [state, formAction, isPending] = useActionState(
    async (prevState: ContentActionResult | null, formData: FormData) => {
      return updateContentAction(content.id, formData)
    },
    null
  )

  // Handle successful update
  useEffect(() => {
    if (state?.success) {
      router.push(`/universes/${content.universeId}`)
    }
  }, [state, router, content.universeId])

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
    </div>
  )
}
