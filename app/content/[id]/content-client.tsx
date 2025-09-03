'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Content, Universe, User } from '@/lib/types'
import { PageLayout } from '@/components/layout/PageLayout'
import { useProgressStore } from '@/lib/stores/progress-store'
import { type HierarchyNode } from '@/lib/utils/progress'
import { deleteContentAction } from '@/lib/actions/content-actions'
import { ConfirmModal } from '@/components/interactive/ConfirmModal'
import { ContentHeader } from '@/components/content/ContentHeader'
import { ContentActions } from '@/components/content/ContentActions'

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
}

interface ContentClientProps {
  content: ContentWithFavourite
  contentOwner: User | null
  universe: Universe
  universeContent: ContentWithFavourite[]
  hierarchyTree: HierarchyNode[]
  userId: string
}

export function ContentClient({
  content,
  contentOwner,
  universe,
  userId,
}: ContentClientProps) {
  const router = useRouter()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const { loadUniverseProgress } = useProgressStore()

  // Load universe-specific progress on mount
  useEffect(() => {
    loadUniverseProgress(universe.id)
  }, [universe.id, loadUniverseProgress])

  const isOwner = userId === content.userId
  const isUniverseOwner = userId === universe.userId

  const handleDeleteContent = async () => {
    if (!isOwner && !isUniverseOwner) return

    setIsDeleting(true)
    try {
      const result = await deleteContentAction(content.id)

      if (result.success) {
        router.push(`/universes/${universe.id}`)
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to delete content:', result.error)
        }
        setIsDeleting(false)
        setShowDeleteConfirm(false)
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error deleting content:', error)
      }
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const headerConfig = ContentHeader({
    content,
    contentOwner,
    universeName: universe.name,
    universeId: universe.id,
  })

  const pageActions = ContentActions({
    content,
    universe,
    isOwner,
    isUniverseOwner,
    onDelete: () => setShowDeleteConfirm(true),
  })

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        ...headerConfig,
        actions: pageActions,
      }}
    >
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title='Delete Content?'
        message={`Are you sure you want to delete "${content.name}"? This action cannot be undone.`}
        confirmText='Delete Content'
        isLoading={isDeleting}
        onConfirm={handleDeleteContent}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </PageLayout>
  )
}
