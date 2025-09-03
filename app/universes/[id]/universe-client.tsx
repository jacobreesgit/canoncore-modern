'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Universe, Content, User } from '@/lib/types'
import { PageLayout } from '@/components/layout/PageLayout'
import { useProgressStore } from '@/lib/stores/progress-store'
import { type HierarchyNode } from '@/lib/utils/progress'
import { deleteUniverseAction } from '@/lib/actions/universe-actions'
import { ConfirmModal } from '@/components/interactive/ConfirmModal'
import { UniverseHeader } from '@/components/universe/UniverseHeader'
import { UniverseActions } from '@/components/universe/UniverseActions'
import { UniverseContent } from '@/components/universe/UniverseContent'
import { HiEye, HiCollection } from 'react-icons/hi'

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
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree')

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

  const headerConfig = UniverseHeader({
    universe,
    universeOwner,
    universeProgress,
  })

  // Create add content buttons for page header
  const addContentActions = isOwner
    ? [
        {
          type: 'primary' as const,
          label: 'Add Viewable Content',
          href: `/universes/${universe.id}/content/add-viewable`,
          icon: <HiEye className='h-4 w-4' />,
        },
        {
          type: 'secondary' as const,
          label: 'Add Organization',
          href: `/universes/${universe.id}/content/organise`,
          icon: <HiCollection className='h-4 w-4' />,
        },
      ]
    : []

  const universeActions = UniverseActions({
    universe,
    isOwner,
    onDelete: () => setShowDeleteConfirm(true),
  })

  const pageActions = [...addContentActions, ...universeActions]

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        ...headerConfig,
        actions: pageActions,
      }}
    >
      {/* Content Hierarchy Display */}
      <UniverseContent
        content={content}
        hierarchyTree={hierarchyTree}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title='Delete Universe?'
        message={`Are you sure you want to delete "${universe.name}"? This action cannot be undone and will delete all content in this universe.`}
        confirmText='Delete Universe'
        isLoading={isDeleting}
        onConfirm={handleDeleteUniverse}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </PageLayout>
  )
}
