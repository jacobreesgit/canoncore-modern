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

const organizationalTypes = [
  {
    value: 'series',
    label: 'Series & Collections',
    description: 'TV series, movie series, book series',
  },
  {
    value: 'phase',
    label: 'Phases & Arcs',
    description: 'Story phases, character arcs, time periods',
  },
  {
    value: 'character',
    label: 'Characters & People',
    description: 'Main characters, actors, creators',
  },
  {
    value: 'location',
    label: 'Locations & Settings',
    description: 'Planets, cities, buildings, settings',
  },
  {
    value: 'other',
    label: 'Other Organization',
    description: 'Custom organizational categories',
  },
]

interface OrganiseClientProps {
  universe: Universe
  existingContent: Content[]
  suggestedParent: Content | null
}

/**
 * Add Organizational Content Client Component
 */
export function OrganiseClient({
  universe,
  existingContent,
  suggestedParent,
}: OrganiseClientProps) {
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
      enhancedFormData.append('isViewable', 'false')

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

        <FormField label='Organization Name' required>
          <FormInput
            name='name'
            placeholder='e.g., Phase One, Captain America Series, Avengers Team'
            disabled={isPending}
            required
          />
        </FormField>

        <FormField label='Description'>
          <FormTextarea
            name='description'
            placeholder='Brief description of this organizational group...'
            rows={3}
            disabled={isPending}
          />
        </FormField>

        <FormField label='Organization Type' required>
          <FormSelect name='organizationType' disabled={isPending} required>
            {organizationalTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormSelect>
          <p className='text-sm text-gray-600 mt-1'>
            Choose how this content helps organize your universe
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
              Nest this organization under another organizational group
            </p>
          </FormField>
        )}

        <FormActions
          submitLabel='Add Organization'
          cancelHref={`/universes/${universe.id}`}
          isSubmitting={isPending}
        />
      </form>
    </div>
  )
}
