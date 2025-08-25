'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Universe, Content, User } from '@/lib/types'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button, ButtonLink } from '@/components/interactive/Button'
import { SearchBar } from '@/components/interactive/SearchBar'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { Badge } from '@/components/content/Badge'
import { Tree } from '@/components/content/Tree'
import { useProgressStore } from '@/stores/progress-store'
import { formatProgressText, type HierarchyNode } from '@/lib/utils/progress'
import { deleteUniverseAction } from '@/lib/actions/universe-actions'
import { HiPencil, HiTrash, HiEye, HiCollection } from 'react-icons/hi'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { getUniverseProgress } = useProgressStore()

  // Convert hierarchyTree to HierarchyNode format for progress calculation
  const hierarchyNodes = hierarchyTree

  // Calculate universe progress
  const universeProgress = getUniverseProgress(hierarchyNodes, content)

  const isOwner = userId === universe.userId

  // Filter content based on search
  const filteredContent = content.filter(
    item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description &&
        item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const handleDeleteUniverse = async () => {
    if (!isOwner) return

    setIsDeleting(true)
    try {
      const result = await deleteUniverseAction(universe.id)

      if (result.success) {
        router.push('/')
      } else {
        console.error('Failed to delete universe:', result.error)
        setIsDeleting(false)
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      console.error('Error deleting universe:', error)
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
        icon: <HiPencil className='h-4 w-4' />,
      },
      {
        type: 'danger' as const,
        label: 'Delete Universe',
        onClick: () => setShowDeleteConfirm(true),
        icon: <HiTrash className='h-4 w-4' />,
      }
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title={universe.name}
        description={universe.description || undefined}
        actions={pageActions}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: universe.name, href: `/universes/${universe.id}` },
        ]}
      />

      {/* Universe Info */}
      <div className='mb-8 bg-white rounded-lg shadow-sm p-6'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-4'>
              <FavouriteButton
                targetId={universe.id}
                targetType='universe'
                size='small'
              />
              {universe.isPublic && (
                <Badge variant='public' size='small'>
                  Public
                </Badge>
              )}
              {!universe.isPublic && (
                <Badge variant='private' size='small'>
                  Private
                </Badge>
              )}
            </div>

            {universeOwner && (
              <div className='text-sm text-gray-600 mb-4'>
                Created by {universeOwner.name || universeOwner.email}
                {universe.createdAt && (
                  <span suppressHydrationWarning>
                    {' '}
                    on {new Date(universe.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {universe.sourceLink && (
              <div className='mb-4'>
                <a
                  href={universe.sourceLink}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-blue-600 hover:text-blue-700 text-sm'
                >
                  {universe.sourceLinkName || 'Source'} ↗
                </a>
              </div>
            )}

            {/* Universe Progress */}
            {content.length > 0 && (
              <div className='mb-4'>
                <div className='text-sm text-gray-600 mb-2'>
                  Overall Progress
                </div>
                <div className='flex items-center gap-3'>
                  <div className='flex-1 bg-gray-200 rounded-full h-2'>
                    <div
                      className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                      style={{
                        width: `${Math.round(universeProgress.percentage)}%`,
                      }}
                    />
                  </div>
                  <div className='text-sm font-medium text-gray-900'>
                    {formatProgressText(universeProgress, 'viewable')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Management */}
      {isOwner && (
        <div className='mb-8 bg-white rounded-lg shadow-sm p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Add Content
          </h3>
          <div className='flex flex-wrap gap-4'>
            <ButtonLink
              href={`/universes/${universe.id}/content/add-viewable`}
              variant='primary'
              size='sm'
              icon={<HiEye className='h-4 w-4' />}
            >
              Add Viewable Content
            </ButtonLink>
            <ButtonLink
              href={`/universes/${universe.id}/content/organise`}
              variant='secondary'
              size='sm'
              icon={<HiCollection className='h-4 w-4' />}
            >
              Add Organization
            </ButtonLink>
          </div>
        </div>
      )}

      {/* Content Hierarchy Display */}
      <div className='mb-8'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-xl font-semibold text-gray-900'>
            Content Hierarchy
          </h2>
          <div className='flex items-center gap-4'>
            <SearchBar
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder='Search content...'
              variant='default'
            />
          </div>
        </div>

        {content.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <div className='max-w-md mx-auto'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                No content yet
              </h3>
              <p className='text-gray-600 mb-6'>
                {isOwner
                  ? 'Start adding content to organize this universe.'
                  : "This universe doesn't have any content yet."}
              </p>
              {isOwner && (
                <div className='flex justify-center gap-4'>
                  <ButtonLink
                    href={`/universes/${universe.id}/content/add-viewable`}
                    variant='primary'
                    icon={<HiEye className='h-4 w-4' />}
                  >
                    Add Viewable Content
                  </ButtonLink>
                  <ButtonLink
                    href={`/universes/${universe.id}/content/organise`}
                    variant='secondary'
                    icon={<HiCollection className='h-4 w-4' />}
                  >
                    Add Organization
                  </ButtonLink>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <Tree
              variant='full'
              hierarchyTree={hierarchyTree}
              content={content}
              contentHref={content => `/content/${content.id}`}
              searchQuery={searchQuery}
              filteredContent={filteredContent}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
          <div className='bg-white rounded-lg p-6 w-full max-w-md'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Delete Universe?
            </h3>
            <p className='text-gray-600 mb-6'>
              Are you sure you want to delete {`"${universe.name}"`}? This
              action cannot be undone and will delete all content in this
              universe.
            </p>
            <div className='flex justify-end gap-4'>
              <Button
                variant='secondary'
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
    </PageContainer>
  )
}
