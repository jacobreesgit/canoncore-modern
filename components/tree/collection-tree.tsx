'use client'

/**
 * Collection tree component showing Collections → Groups → Content hierarchy
 * Following @headless-tree/react best practices
 */

import { useRouter } from 'next/navigation'
import { BaseTree } from './base-tree'
import { HierarchyData } from './tree-types'
import { reorderCollectionsAction } from '@/lib/actions/collection-actions'
import { reorderGroupsAction } from '@/lib/actions/group-actions'
import { reorderContentAction } from '@/lib/actions/content-actions'

interface CollectionTreeProps {
  universeId: string
  hierarchyData: HierarchyData
  className?: string
}

export function CollectionTree({
  universeId,
  hierarchyData,
  className,
}: CollectionTreeProps) {
  const router = useRouter()

  const handleReorder = async (items: { id: string; newOrder: number }[]) => {
    try {
      // Determine which type of items we're reordering based on the data
      if (hierarchyData.collections && items.length > 0) {
        const firstItem = items[0]
        const isCollection = hierarchyData.collections.some(
          c => c.id === firstItem.id
        )

        if (isCollection) {
          // Reordering collections
          const result = await reorderCollectionsAction({
            universeId,
            items: items.map(item => ({ id: item.id, order: item.newOrder })),
          })

          if (!result.success) {
            throw new Error(result.error || 'Failed to reorder collections')
          }
        } else if (hierarchyData.groups) {
          // Check if it's groups
          const groupData = hierarchyData.groups.find(
            g => g.id === firstItem.id
          )

          if (groupData) {
            const collectionId = groupData.collectionId
            const result = await reorderGroupsAction({
              collectionId,
              items: items.map(item => ({ id: item.id, order: item.newOrder })),
            })

            if (!result.success) {
              throw new Error(result.error || 'Failed to reorder groups')
            }
          }
        } else if (hierarchyData.content) {
          // Check if it's content
          const contentData = hierarchyData.content.find(
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
      }

      // Refresh the page to show updated order
      router.refresh()
    } catch (error) {
      console.error('Error reordering items:', error)
      // Could add toast notification here
    }
  }

  const handleSelect = (itemId: string) => {
    // Navigate to the appropriate detail page based on item type
    if (hierarchyData.collections?.some(c => c.id === itemId)) {
      router.push(`/universes/${universeId}/collections/${itemId}`)
    } else if (hierarchyData.groups?.some(g => g.id === itemId)) {
      const groupData = hierarchyData.groups.find(g => g.id === itemId)
      if (groupData) {
        const collectionId = groupData.collectionId
        router.push(
          `/universes/${universeId}/collections/${collectionId}/groups/${itemId}`
        )
      }
    } else if (hierarchyData.content?.some(c => c.id === itemId)) {
      const contentData = hierarchyData.content.find(c => c.id === itemId)
      if (contentData) {
        const groupId = contentData.groupId
        const collectionId = contentData.collectionId
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
      onSelect={handleSelect}
      className={className}
    />
  )
}
