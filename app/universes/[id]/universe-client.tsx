'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Universe, Content, User } from '@/lib/types'
import { PageLayout } from '@/components/layout/PageLayout'
import { Button, ButtonLink } from '@/components/interactive/Button'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { Badge } from '@/components/content/Badge'
import { ProgressBar } from '@/components/content/ProgressBar'
import { Tree } from '@/components/content/Tree'
import { useProgressStore } from '@/lib/stores/progress-store'
import { type HierarchyNode } from '@/lib/utils/progress'
import { deleteUniverseAction } from '@/lib/actions/universe-actions'
import {
  HiPencil,
  HiTrash,
  HiExternalLink,
  HiEye,
  HiCollection,
} from 'react-icons/hi'
import { Icon } from '@/components/interactive/Icon'

interface UniverseWithFavourite extends Universe {
  isFavourite?: boolean
}

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
}

interface UniverseClientProps {
  universe: UniverseWithFavourite
  universeOwner: User | null
  content: ContentWithFavourite[]
  hierarchyTree: HierarchyNode[]
  userId: string
}

export function UniverseClient({
  universe,
  universeOwner,
  content,
  hierarchyTree,
  userId,
}: UniverseClientProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { getUniverseProgress, loadUniverseProgress } = useProgressStore()

  // Load universe-specific progress on mount
  useEffect(() => {
    loadUniverseProgress(universe.id)
  }, [universe.id, loadUniverseProgress])

  // Convert hierarchyTree to HierarchyNode format for progress calculation
  const hierarchyNodes = hierarchyTree

  // Calculate universe progress
  const universeProgress = getUniverseProgress(hierarchyNodes, content)

  const isOwner = userId === universe.userId

  const handleDeleteUniverse = async () => {
    if (!isOwner) return

    setIsDeleting(true)
    try {
      const result = await deleteUniverseAction(universe.id)

      if (result.success) {
        router.push('/')
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to delete universe:', result.error)
        }
        setIsDeleting(false)
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting universe:', error)
      }
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const pageActions = []

  if (isOwner) {
    pageActions.push(
      {
        type: 'secondary' as const,
        label: 'Edit Universe',
        href: `/universes/${universe.id}/edit`,
        icon: <Icon icon={HiPencil} />,
      },
      {
        type: 'danger' as const,
        label: 'Delete Universe',
        onClick: () => setShowDeleteConfirm(true),
        icon: <Icon icon={HiTrash} />,
      }
    )
  }

  const headerMetadata = (
    <div className='flex items-center gap-3'>
      {universe.isPublic ? (
        <Badge variant='public' size='small'>
          Public
        </Badge>
      ) : (
        <Badge variant='private' size='small'>
          Private
        </Badge>
      )}
      {universe.sourceLink && (
        <a
          href={universe.sourceLink}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-block'
        >
          <Badge
            variant='info'
            size='small'
            className='hover:bg-primary-200 transition-colors cursor-pointer'
            icon={<Icon icon={HiExternalLink} size='sm' />}
          >
            {universe.sourceLinkName || 'Source'}
          </Badge>
        </a>
      )}
      {universeOwner && (
        <span className='text-sm text-neutral-600'>
          Created by {universeOwner.name || universeOwner.email}
          {universe.createdAt && (
            <span suppressHydrationWarning>
              {' '}
              on {new Date(universe.createdAt).toLocaleDateString()}
            </span>
          )}
        </span>
      )}
    </div>
  )

  const titleWithFavourite = (
    <div className='flex items-center gap-2'>
      <span>{universe.name}</span>
      <FavouriteButton targetId={universe.id} targetType='universe' size='xl' />
    </div>
  )

  const progressExtraContent = (
    <ProgressBar
      variant='organisational'
      value={universeProgress.percentage}
      showLabel={true}
    />
  )

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: titleWithFavourite,
        description: universe.description || undefined,
        metadata: headerMetadata,
        actions: pageActions,
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: universe.name, href: `/universes/${universe.id}` },
        ],
        extraContent: progressExtraContent,
      }}
    >
      {/* Content Hierarchy Display */}
      <Tree
        hierarchyTree={hierarchyTree}
        content={content}
        title='Content Hierarchy'
        searchable={true}
        searchPlaceholder='Search content...'
        enableBulkSelection={isOwner}
        button={
          isOwner ? (
            <div className='flex gap-2'>
              <ButtonLink
                href={`/universes/${universe.id}/content/add-viewable`}
                variant='primary'
                icon={<HiEye className='h-4 w-4' />}
              >
                Add Viewable Content
              </ButtonLink>
              <ButtonLink
                href={`/universes/${universe.id}/content/organise`}
                variant='accent'
                icon={<HiCollection className='h-4 w-4' />}
              >
                Add Organization
              </ButtonLink>
            </div>
          ) : undefined
        }
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-medium text-neutral-900 mb-4'>
              Delete Universe?
            </h3>
            <p className='text-neutral-600 mb-6'>
              Are you sure you want to delete {`"${universe.name}"`}? This
              action cannot be undone and will delete all content in this
              universe.
            </p>
            <div className='flex justify-end gap-4'>
              <Button
                variant='danger'
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant='danger'
                onClick={handleDeleteUniverse}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Universe'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageLayout>
  )
}
