'use client'

/**
 * Content tree component showing Content → Sub-content hierarchy
 * Following @headless-tree/react best practices
 */

import { useRouter } from 'next/navigation'
import { BaseTree } from './base-tree'
import { HierarchyData } from './tree-types'
import {
  reorderContentAction,
  moveContentAction,
} from '@/lib/actions/content-actions'

interface ContentTreeProps {
  universeId: string
  collectionId: string
  groupId: string
  hierarchyData: HierarchyData
  className?: string
}

export function ContentTree({
  universeId,
  collectionId,
  groupId,
  hierarchyData,
  className,
}: ContentTreeProps) {
  const router = useRouter()

  const handleReorder = async (items: { id: string; newOrder: number }[]) => {
    try {
      if (!items.length) return

      const result = await reorderContentAction({
        groupId,
        items: items.map(item => ({ id: item.id, order: item.newOrder })),
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to reorder content')
      }

      // Refresh to show updated order
      router.refresh()
    } catch (error) {
      console.error('Error reordering content:', error)
    }
  }

  const handleMove = async (
    itemId: string,
    newParentId: string | null,
    newOrder: number
  ) => {
    try {
      const result = await moveContentAction({
        contentId: itemId,
        newParentId,
        newOrder,
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to move content')
      }

      // Refresh to show changes
      router.refresh()
    } catch (error) {
      console.error('Error moving content:', error)
    }
  }

  const handleSelect = (itemId: string) => {
    // Navigate to content detail page
    router.push(
      `/universes/${universeId}/collections/${collectionId}/groups/${groupId}/content/${itemId}`
    )
  }

  return (
    <BaseTree
      hierarchyData={hierarchyData}
      onReorder={handleReorder}
      onMove={handleMove}
      onSelect={handleSelect}
      className={className}
    />
  )
}
