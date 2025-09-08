'use client'

/**
 * Group tree component showing Groups → Content → Sub-content hierarchy
 * Following @headless-tree/react best practices
 */

import { useRouter } from 'next/navigation'
import { BaseTree } from './base-tree'
import { HierarchyData } from './tree-types'
import {
  reorderGroupsAction,
  moveGroupAction,
} from '@/lib/actions/group-actions'
import {
  reorderContentAction,
  moveContentAction,
} from '@/lib/actions/content-actions'

interface GroupTreeProps {
  universeId: string
  collectionId: string
  hierarchyData: HierarchyData
  className?: string
}

export function GroupTree({
  universeId,
  collectionId,
  hierarchyData,
  className,
}: GroupTreeProps) {
  const router = useRouter()

  const handleReorder = async (items: { id: string; newOrder: number }[]) => {
    try {
      if (!items.length) return

      const firstItem = items[0]

      // Check if we're reordering groups
      const isGroup = hierarchyData.groups?.some(g => g.id === firstItem.id)

      if (isGroup) {
        const result = await reorderGroupsAction({
          collectionId,
          items: items.map(item => ({ id: item.id, order: item.newOrder })),
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to reorder groups')
        }
      } else {
        // Check if we're reordering content
        const contentData = hierarchyData.content?.find(
          c => c.id === firstItem.id
        )

        if (contentData) {
          const groupId = contentData.groupId
          const result = await reorderContentAction({
            groupId,
            items: items.map(item => ({ id: item.id, order: item.newOrder })),
          })

          if (!result.success) {
            throw new Error(result.error || 'Failed to reorder content')
          }
        }
      }

      // Refresh to show updated order
      router.refresh()
    } catch (error) {
      console.error('Error reordering items:', error)
    }
  }

  const handleMove = async (
    itemId: string,
    newParentId: string | null,
    newOrder: number
  ) => {
    try {
      // Check if we're moving a group
      const isGroup = hierarchyData.groups?.some(g => g.id === itemId)

      if (isGroup) {
        const result = await moveGroupAction({
          groupId: itemId,
          newParentId,
          newOrder,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to move group')
        }
      } else {
        // Moving content
        const result = await moveContentAction({
          contentId: itemId,
          newParentId,
          newOrder,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to move content')
        }
      }

      // Refresh to show changes
      router.refresh()
    } catch (error) {
      console.error('Error moving item:', error)
    }
  }

  const handleSelect = (itemId: string) => {
    // Navigate to appropriate detail page
    if (hierarchyData.groups?.some(g => g.id === itemId)) {
      router.push(
        `/universes/${universeId}/collections/${collectionId}/groups/${itemId}`
      )
    } else if (hierarchyData.content?.some(c => c.id === itemId)) {
      const contentData = hierarchyData.content.find(c => c.id === itemId)
      if (contentData) {
        const groupId = contentData.groupId
        router.push(
          `/universes/${universeId}/collections/${collectionId}/groups/${groupId}/content/${itemId}`
        )
      }
    }
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
