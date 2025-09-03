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
import { HierarchicalSelect } from '@/components/forms/HierarchicalSelect'
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
  relationships: { parentId: string | null; childId: string }[]
  suggestedParent: Content | null
}

/**
 * Add Organizational Content Client Component
 */
export function OrganiseClient({
  universe,
  existingContent,
  relationships,
  suggestedParent,
}: OrganiseClientProps) {
  const router = useRouter()
  const [selectedParentId, setSelectedParentId] = useState(
    suggestedParent?.id || ''
  )

  // We'll show all content in hierarchy now, with viewable content disabled

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
    <div className='bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'>
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
          <FormSelect name='itemType' disabled={isPending} required>
            {organizationalTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormSelect>
          <p className='text-sm text-neutral-600 mt-1'>
            Choose how this content helps organize your universe
          </p>
        </FormField>

        {existingContent.length > 0 && (
          <FormField label='Parent Organization (Optional)'>
            <HierarchicalSelect
              name='parentId'
              value={selectedParentId}
              onChange={e => setSelectedParentId(e.target.value)}
              disabled={isPending}
              allContent={existingContent}
              relationships={relationships}
              noneOptionLabel='No parent (top level)'
            />
            <p className='text-sm text-neutral-600 mt-1'>
              Nest this organization under another group. Viewable content is
              shown for context but disabled.
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
