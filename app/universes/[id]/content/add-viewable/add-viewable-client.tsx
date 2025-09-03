'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Universe, Content, Source } from '@/lib/types'
import {
  createContentAction,
  ContentActionResult,
} from '@/lib/actions/content-actions'
import { FormField } from '@/components/forms/FormField'
import { FormInput } from '@/components/forms/FormInput'
import { FormTextarea } from '@/components/forms/FormTextarea'
import { FormSelect } from '@/components/forms/FormSelect'
import { HierarchicalSelect } from '@/components/forms/HierarchicalSelect'
import { SourceSelect } from '@/components/forms/SourceSelect'
import { FormActions } from '@/components/forms/FormActions'
import { FormError } from '@/components/forms/FormError'

const viewableItemTypes = [
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
  relationships: { parentId: string | null; childId: string }[]
  suggestedParent: Content | null
  sources: Source[]
}

/**
 * Add Viewable Content Client Component
 */
export function AddViewableClient({
  universe,
  existingContent,
  relationships,
  suggestedParent,
  sources,
}: AddViewableClientProps) {
  const router = useRouter()
  const [selectedParentId, setSelectedParentId] = useState(
    suggestedParent?.id || ''
  )
  const [selectedSourceId, setSelectedSourceId] = useState('')
  const [currentSources, setCurrentSources] = useState(sources)

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
      enhancedFormData.append('isViewable', 'true')
      enhancedFormData.append('itemType', formData.get('itemType') as string)

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
          <FormSelect name='itemType' disabled={isPending} required>
            {viewableItemTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </FormSelect>
          <p className='text-sm text-neutral-600 mt-1'>
            Choose the type of viewable content you&apos;re adding
          </p>
        </FormField>

        <FormField label='Source/Origin (Optional)'>
          <SourceSelect
            name='sourceId'
            universeId={universe.id}
            sources={currentSources}
            value={selectedSourceId}
            onChange={e => setSelectedSourceId(e.target.value)}
            disabled={isPending}
            onSourceCreated={newSource => {
              setCurrentSources(prev => [...prev, newSource])
              setSelectedSourceId(newSource.id)
            }}
          />
          <p className='text-sm text-neutral-600 mt-1'>
            Tag where this content originates from (e.g., Disney+, Television).
            Badges show only in Flat View.
          </p>
        </FormField>

        {existingContent.length > 0 && (
          <FormField label='Parent Content (Optional)'>
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
              Organize this content under another content item. Viewable content
              is shown for context but disabled.
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
