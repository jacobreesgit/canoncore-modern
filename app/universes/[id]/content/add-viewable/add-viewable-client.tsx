'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Universe, Content } from '@/lib/types'
import {
  createContentAction,
  ContentActionResult,
} from '@/lib/actions/content-actions'
import { FormField } from '@/components/forms/FormField'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormActions } from '@/components/forms/FormActions'
import { FormError } from '@/components/forms/FormError'

const viewableMediaTypes = [
  {
    value: 'video',
    label: 'Movies & Episodes',
    description: 'Films, TV episodes, web series',
  },
  {
    value: 'audio',
    label: 'Audio Content',
    description: 'Podcasts, audiobooks, audio dramas',
  },
  {
    value: 'text',
    label: 'Books & Comics',
    description: 'Books, comics, articles, graphic novels',
  },
]

interface AddViewableClientProps {
  universe: Universe
  existingContent: Content[]
  suggestedParent: Content | null
}

/**
 * Add Viewable Content Client Component
 */
export function AddViewableClient({
  universe,
  existingContent,
  suggestedParent,
}: AddViewableClientProps) {
  const router = useRouter()
  const [selectedParentId, setSelectedParentId] = useState(
    suggestedParent?.id || ''
  )

  // Filter content that can be parents (organizational content)
  const potentialParents = existingContent.filter(c => !c.isViewable)

  // React 19: useActionState for form management
  const [state, formAction, isPending] = useActionState(
    async (prevState: ContentActionResult | null, formData: FormData) => {
      // Add universe ID and content type to form data
      const enhancedFormData = new FormData()
      for (const [key, value] of formData.entries()) {
        enhancedFormData.append(key, value)
      }
      enhancedFormData.append('universeId', universe.id)
      enhancedFormData.append('isViewable', 'true')
      enhancedFormData.append('mediaType', formData.get('mediaType') as string)

      return createContentAction(enhancedFormData)
    },
    null
  )

  // Handle successful creation
  useEffect(() => {
    if (state?.success) {
      router.push(`/universes/${universe.id}`)
    }
  }, [state, router, universe.id])

  return (
    <div className='bg-white rounded-lg shadow-sm'>
      <form action={formAction} className='p-6 space-y-6'>
        <FormError error={state?.error} />

        <FormField label='Content Name' required>
          <FormInput
            name='name'
            placeholder='e.g., Iron Man, The Avengers Episode 1'
            disabled={isPending}
            required
          />
        </FormField>

        <FormField label='Description'>
          <FormTextarea
            name='description'
            placeholder='Brief description of this content...'
            rows={3}
            disabled={isPending}
          />
        </FormField>

        <FormField label='Content Type' required>
          <FormSelect name='mediaType' disabled={isPending} required>
            {viewableMediaTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormSelect>
          <p className='text-sm text-gray-600 mt-1'>
            Choose the type of viewable content you&apos;re adding
          </p>
        </FormField>

        {potentialParents.length > 0 && (
          <FormField label='Parent Organization (Optional)'>
            <FormSelect
              name='parentId'
              value={selectedParentId}
              onChange={e => setSelectedParentId(e.target.value)}
              disabled={isPending}
            >
              <option value=''>No parent (top level)</option>
              {potentialParents.map(parent => (
                <option key={parent.id} value={parent.id}>
                  {parent.name}
                </option>
              ))}
            </FormSelect>
            <p className='text-sm text-gray-600 mt-1'>
              Organize this content under a series, phase, or collection
            </p>
          </FormField>
        )}

        <FormActions
          submitLabel='Add Viewable Content'
          cancelHref={`/universes/${universe.id}`}
          isSubmitting={isPending}
        />
      </form>
    </div>
  )
}
