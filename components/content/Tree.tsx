'use client'

import React, { useMemo, useEffect, ReactNode } from 'react'
import { useTree } from '@headless-tree/react'
import {
  syncDataLoaderFeature,
  hotkeysCoreFeature,
  searchFeature,
  expandAllFeature,
} from '@headless-tree/core'
import { ContentWithProgress } from '@/lib/types'
import { type HierarchyNode } from '@/lib/utils/progress'
import { ContentDisplay } from './ContentDisplay'
import { SearchBar } from '@/components/interactive/SearchBar'
import { TreeItem } from './TreeItem'

export interface TreeProps {
  hierarchyTree: HierarchyNode[]
  content: ContentWithProgress[]
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Display variant for styling */
  variant?: string
  /** Current content ID for highlighting */
  currentContentId?: string
  /** Actions that appear in header */
  actions?: ReactNode
  /** Whether to show search functionality */
  searchable?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Container className */
  className?: string
}

export function Tree({
  hierarchyTree,
  content,
  title,
  description,
  variant: _variant, // eslint-disable-line @typescript-eslint/no-unused-vars
  currentContentId: _currentContentId, // eslint-disable-line @typescript-eslint/no-unused-vars
  actions,
  searchable = false,
  searchPlaceholder = 'Search content...',
  className = '',
}: TreeProps) {
  // Create item lookup and children lookup for headless-tree
  const { itemLookup, childrenLookup } = useMemo(() => {
    const itemLookup: Record<string, ContentWithProgress> = {}
    const childrenLookup: Record<string, string[]> = {}

    childrenLookup.root = []

    // Process hierarchy tree
    const processNode = (node: HierarchyNode, parentId: string = 'root') => {
      const contentItem = content.find(c => c.id === node.contentId)
      if (!contentItem) return

      const itemId = node.contentId
      itemLookup[itemId] = contentItem
      childrenLookup[itemId] =
        node.children?.map(child => child.contentId) || []

      if (!childrenLookup[parentId]) {
        childrenLookup[parentId] = []
      }
      childrenLookup[parentId].push(itemId)

      // Process children recursively
      node.children?.forEach(child => processNode(child, itemId))
    }

    hierarchyTree.forEach(node => processNode(node))

    return { itemLookup, childrenLookup }
  }, [hierarchyTree, content])

  const tree = useTree<string>({
    rootItemId: 'root',
    getItemName: item => {
      const itemId = item.getItemData()
      return itemLookup[itemId]?.name || ''
    },
    isItemFolder: item => {
      const itemId = item.getItemData()
      return itemId === 'root' || (childrenLookup[itemId]?.length || 0) > 0
    },
    dataLoader: {
      getItem: itemId => {
        if (itemId === 'root') return 'root'
        return itemId
      },
      getChildren: itemId => childrenLookup[itemId] || [],
    },
    initialState: {
      expandedItems: ['root'],
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      searchFeature,
      expandAllFeature,
    ],
  })

  // Expand all items by default
  useEffect(() => {
    tree.expandAll()
  }, [tree])

  const hasItems = Object.keys(itemLookup).length > 0
  const searchMatchingItems = tree.getSearchMatchingItems()
  const isSearching = tree.isSearchOpen()

  return (
    <ContentDisplay
      title={title}
      description={description}
      actions={actions}
      isEmpty={!hasItems}
      emptyStateTitle='No content yet'
      emptyStateDescription='Add some content to see it organized in the tree.'
      className={className}
    >
      {/* Controls Bar - Show when has content */}
      {hasItems && (
        <div className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
            {/* Search Section */}
            {searchable && (
              <div className='flex-1'>
                <SearchBar
                  {...tree.getSearchInputElementProps()}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}

            {/* Action Buttons Section */}
            <div className='flex items-center gap-4 flex-wrap'></div>
          </div>

          {/* Search Results Count */}
          {searchable && isSearching && (
            <div className='mt-2 text-sm text-neutral-600'>
              {searchMatchingItems.length} match
              {searchMatchingItems.length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {hasItems && (
        <div {...tree.getContainerProps()} className='tree'>
          {tree
            .getItems()
            .filter(item => item.getId() !== 'root')
            .filter(
              (item, index, arr) =>
                arr.findIndex(i => i.getId() === item.getId()) === index
            )
            .map((item, index) => {
              const itemData = itemLookup[item.getId()]
              if (!itemData) return null

              return (
                <TreeItem
                  key={`${item.getId()}-${index}`}
                  item={item}
                  itemData={itemData}
                  index={index}
                />
              )
            })}
        </div>
      )}
    </ContentDisplay>
  )
}

export default Tree
