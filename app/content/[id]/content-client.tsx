'use client'

import { useState } from 'react'
import { Content, Universe } from '@/lib/db/schema'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button, ButtonLink } from '@/components/interactive/Button'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { ProgressBar } from '@/components/content/ProgressBar'
import { Badge } from '@/components/content/Badge'
import { useProgressStore } from '@/lib/stores/progress-store'
import {
  HiPencil,
  HiEye,
  HiCollection,
  HiChevronUp,
  HiChevronDown,
} from 'react-icons/hi'

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
}

interface ContentClientProps {
  content: ContentWithFavourite
  universe: Universe
  parentContent: Content[]
  childContent: Content[]
  canEdit: boolean
}

export function ContentClient({
  content,
  universe,
  parentContent,
  childContent,
  canEdit,
}: ContentClientProps) {
  const [showChildren, setShowChildren] = useState(true)
  const [showParents, setShowParents] = useState(true)

  const { getProgress } = useProgressStore()
  const currentProgress = getProgress(content.id)

  const pageActions = []

  if (canEdit) {
    pageActions.push({
      type: 'secondary' as const,
      label: 'Edit Content',
      href: `/universes/${content.universeId}/content/${content.id}/edit`,
      icon: <HiPencil className='h-4 w-4' />,
    })
  }

  const titleWithFavourite = (
    <div className='flex items-center gap-2'>
      <span>{content.name}</span>
      <FavouriteButton targetId={content.id} targetType='content' size='xl' />
    </div>
  )

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: titleWithFavourite,
        description: content.description || undefined,
        actions: pageActions,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: universe.name, href: `/universes/${universe.id}` },
          { label: content.name, href: `/content/${content.id}` },
        ],
      }}
    >
      {/* Content Info */}
      <div className='mb-8 bg-white rounded-lg shadow-sm p-6 border border-neutral-200 hover:shadow-md transition-shadow'>
        <div className='flex items-start justify-between mb-6'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-4'>
              <Badge
                variant={content.isViewable ? 'info' : 'organisational'}
                size='small'
              >
                {content.isViewable ? 'Viewable Content' : 'Organization'}
              </Badge>
              {content.mediaType && (
                <Badge variant='info' size='small'>
                  {content.mediaType}
                </Badge>
              )}
            </div>

            <div className='text-sm text-neutral-600 mb-4'>
              From{' '}
              <ButtonLink
                href={`/universes/${universe.id}`}
                variant='clear'
                className='text-primary-600 hover:text-primary-700'
              >
                {universe.name}
              </ButtonLink>
            </div>
          </div>
        </div>

        {/* Progress Tracking for Viewable Content */}
        {content.isViewable && (
          <div className='mb-6'>
            <h3 className='text-lg font-medium text-neutral-900 mb-3'>
              Progress
            </h3>
            <ProgressBar
              value={currentProgress}
              variant='viewable'
              size='large'
              showLabel={true}
              label='Progress'
            />
          </div>
        )}
      </div>

      {/* Parent Content */}
      {parentContent.length > 0 && (
        <div className='mb-8 bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'>
          <div className='p-6 border-b'>
            <Button
              onClick={() => setShowParents(!showParents)}
              variant='clear'
              className='flex items-center gap-2 text-lg font-medium text-neutral-900 hover:text-neutral-700 p-0'
            >
              {showParents ? (
                <HiChevronDown className='h-5 w-5' />
              ) : (
                <HiChevronUp className='h-5 w-5' />
              )}
              Parent Organization ({parentContent.length})
            </Button>
          </div>
          {showParents && (
            <div className='p-6'>
              <div className='space-y-3'>
                {parentContent.map(parent => (
                  <div
                    key={parent.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <Badge variant='organisational' size='small'>
                        {parent.isViewable ? 'Viewable' : 'Organization'}
                      </Badge>
                      <span className='font-medium text-neutral-900'>
                        {parent.name}
                      </span>
                      {parent.description && (
                        <span className='text-sm text-neutral-600'>
                          - {parent.description}
                        </span>
                      )}
                    </div>
                    <ButtonLink
                      href={`/content/${parent.id}`}
                      variant='secondary'
                      size='small'
                    >
                      View
                    </ButtonLink>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Child Content */}
      {childContent.length > 0 && (
        <div className='mb-8 bg-white rounded-lg shadow-sm border border-neutral-200 hover:shadow-md transition-shadow'>
          <div className='p-6 border-b'>
            <Button
              onClick={() => setShowChildren(!showChildren)}
              variant='clear'
              className='flex items-center gap-2 text-lg font-medium text-neutral-900 hover:text-neutral-700 p-0'
            >
              {showChildren ? (
                <HiChevronDown className='h-5 w-5' />
              ) : (
                <HiChevronUp className='h-5 w-5' />
              )}
              Child Content ({childContent.length})
            </Button>
          </div>
          {showChildren && (
            <div className='p-6'>
              <div className='space-y-3'>
                {childContent.map(child => (
                  <div
                    key={child.id}
                    className='flex items-center justify-between p-3 border rounded-lg'
                  >
                    <div className='flex items-center gap-3'>
                      <Badge
                        variant={child.isViewable ? 'info' : 'organisational'}
                        size='small'
                      >
                        {child.isViewable ? 'Viewable' : 'Organization'}
                      </Badge>
                      <span className='font-medium text-neutral-900'>
                        {child.name}
                      </span>
                      {child.description && (
                        <span className='text-sm text-neutral-600'>
                          - {child.description}
                        </span>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      {child.isViewable && (
                        <ProgressBar
                          value={getProgress(child.id)}
                          variant='viewable'
                          size='default'
                          showLabel={false}
                        />
                      )}
                      <ButtonLink
                        href={`/content/${child.id}`}
                        variant='secondary'
                        size='small'
                      >
                        View
                      </ButtonLink>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Actions */}
      {canEdit && (
        <div className='bg-white rounded-lg shadow-sm p-6 border border-neutral-200 hover:shadow-md transition-shadow'>
          <h3 className='text-lg font-medium text-neutral-900 mb-4'>
            Quick Actions
          </h3>
          <div className='flex flex-wrap gap-4'>
            <ButtonLink
              href={`/universes/${content.universeId}/content/add-viewable?parent=${content.id}`}
              variant='primary'
              size='small'
              icon={<HiEye className='h-4 w-4' />}
            >
              Add Child Content
            </ButtonLink>
            <ButtonLink
              href={`/universes/${content.universeId}/content/organise?parent=${content.id}`}
              variant='secondary'
              size='small'
              icon={<HiCollection className='h-4 w-4' />}
            >
              Add Organization
            </ButtonLink>
            <ButtonLink
              href={`/universes/${content.universeId}`}
              variant='secondary'
              size='small'
            >
              Back to Universe
            </ButtonLink>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
