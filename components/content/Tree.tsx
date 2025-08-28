'use client'

import React, { useMemo, useEffect, ReactNode, useState } from 'react'
import { useTree } from '@headless-tree/react'
import {
  syncDataLoaderFeature,
  propMemoizationFeature,
  selectionFeature,
  hotkeysCoreFeature,
  searchFeature,
  expandAllFeature,
} from '@headless-tree/core'
import { ContentWithProgress } from '@/lib/types'
import { type HierarchyNode, getContentProgress } from '@/lib/utils/progress'
import { cn } from '@/lib/utils'
import {
  HiChevronRight,
  HiChevronDown,
  HiExternalLink,
  HiTrash,
} from 'react-icons/hi'
import { Icon } from '@/components/interactive/Icon'
import { IconButton } from '@/components/interactive/IconButton'
import { ContentDisplay } from './ContentDisplay'
import { SearchBar } from '@/components/interactive/SearchBar'
import { Button } from '@/components/interactive/Button'
import { ProgressBar } from './ProgressBar'
import Link from 'next/link'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { bulkDeleteContentAction } from '@/lib/actions/content-actions'
import { useRouter } from 'next/navigation'

export interface TreeProps {
  hierarchyTree: HierarchyNode[]
  content: ContentWithProgress[]
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Button that appears in header */
  button?: ReactNode
  /** Additional header actions */
  headerActions?: ReactNode
  /** Whether to show search functionality */
  searchable?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Container className */
  className?: string
  /** Enable bulk operations for selected items (Ctrl+Click, Shift+Click to select) */
  enableBulkSelection?: boolean
}

function TreeItemActions({ itemData }: { itemData: ContentWithProgress }) {
  return (
    <div className='flex items-center'>
      {/* Favourite button */}
      <FavouriteButton
        targetId={itemData.id}
        targetType='content'
        size='default'
      />

      {/* Link to content page button */}
      <Link href={`/content/${itemData.id}`} onClick={e => e.stopPropagation()}>
        <IconButton
          icon={HiExternalLink}
          iconColor='neutral'
          iconHoverColor='primary'
          aria-label={`View ${itemData.name} details`}
          title={`View ${itemData.name} details`}
        />
      </Link>
    </div>
  )
}

export function Tree({
  hierarchyTree,
  content,
  title,
  description,
  button,
  headerActions,
  searchable = false,
  searchPlaceholder = 'Search content...',
  className = '',
  enableBulkSelection = false,
}: TreeProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
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
    indent: 20,
    initialState: {
      expandedItems: ['root'],
    },
    features: [
      syncDataLoaderFeature,
      propMemoizationFeature,
      selectionFeature,
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
  // Get selected items from tree (selectionFeature provides this)
  const selectedItems = tree.getSelectedItems().map(item => item.getId())
  const hasSelectedItems = selectedItems.length > 0 && enableBulkSelection

  const handleBulkDelete = async () => {
    if (!selectedItems.length) return

    // Get content names for better confirmation message
    const selectedContentNames = selectedItems
      .map(id => itemLookup[id]?.name || 'Unknown')
      .slice(0, 3) // Show first 3 names

    const namesList = selectedContentNames.join(', ')
    const moreCount = selectedItems.length - selectedContentNames.length
    const itemsList =
      moreCount > 0 ? `${namesList} and ${moreCount} more` : namesList

    const confirmed = window.confirm(
      `Are you sure you want to delete these ${selectedItems.length} content item${selectedItems.length !== 1 ? 's' : ''}?\n\n${itemsList}\n\nThis action cannot be undone.`
    )

    if (!confirmed) return

    setIsDeleting(true)
    try {
      const result = await bulkDeleteContentAction(selectedItems)

      if (result.success) {
        // Clear selections first
        tree.setSelectedItems([])
        // Refresh to show updated content
        router.refresh()

        // Show message if there were partial failures
        if (result.errors && result.errors.length > 0) {
          alert(`${result.message}\n\nErrors:\n${result.errors.join('\n')}`)
        }
      } else {
        alert(`Failed to delete content: ${result.error}`)
      }
    } catch (error) {
      console.error('Bulk delete error:', error)
      alert('An unexpected error occurred while deleting content.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <ContentDisplay
      title={title}
      description={description}
      button={!hasItems ? button : undefined} // Only show in header when empty
      headerActions={headerActions}
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
            <div className='flex items-center gap-4 flex-wrap'>
              {enableBulkSelection && hasSelectedItems ? (
                /* Selection Actions */
                <>
                  <span className='text-sm font-medium text-neutral-700 whitespace-nowrap'>
                    {selectedItems.length} selected:
                  </span>
                  <div className='flex gap-1.5'>
                    <Button
                      variant='danger'
                      size='small'
                      icon={<Icon icon={HiTrash} />}
                      loading={isDeleting}
                      disabled={isDeleting}
                      onClick={handleBulkDelete}
                    >
                      Delete
                    </Button>
                    <Button
                      variant='accent'
                      size='small'
                      onClick={() => tree.setSelectedItems([])}
                    >
                      Clear
                    </Button>
                  </div>
                </>
              ) : (
                /* Add Buttons */
                button && <div>{button}</div>
              )}
            </div>
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
      {!hasItems ? (
        <div className='text-center py-12'>
          <div className='max-w-md mx-auto'>
            <h3 className='text-lg font-medium text-neutral-900 mb-2'>
              No content yet
            </h3>
            <p className='text-neutral-600 mb-6'>
              Add some content to see it organized in the tree.
            </p>
            {button && <div>{button}</div>}
          </div>
        </div>
      ) : (
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
                <div
                  {...item.getProps()}
                  key={`${item.getId()}-${index}`}
                  style={{ paddingLeft: `${item.getItemMeta().level * 20}px` }}
                >
                  <div
                    className={cn(
                      'treeitem flex items-center p-2 w-full text-left cursor-pointer rounded-lg',
                      {
                        focused: item.isFocused(),
                        expanded: item.isExpanded(),
                        selected: item.isSelected() && !item.isMatchingSearch(),
                        folder: item.isFolder(),
                        'bg-primary-50 border-primary-200':
                          item.isMatchingSearch(),
                      }
                    )}
                  >
                    {/* Expand/collapse arrow for folders */}
                    {item.isFolder() ? (
                      <span className='mr-2 flex-shrink-0'>
                        {item.isExpanded() ? (
                          <Icon icon={HiChevronDown} color='neutral' />
                        ) : (
                          <Icon icon={HiChevronRight} color='neutral' />
                        )}
                      </span>
                    ) : null}
                    <div className='flex items-center gap-2 flex-1'>
                      <span className='truncate'>{item.getItemName()}</span>

                      {/* Action buttons next to title */}
                      <TreeItemActions itemData={itemData} />
                    </div>

                    {/* Progress bar on the right side */}
                    {itemData && (
                      <div className='ml-2 w-32 flex-shrink-0'>
                        <ProgressBar
                          value={getContentProgress(itemData)}
                          variant={
                            itemData.isViewable ? 'viewable' : 'organisational'
                          }
                          showLabel={true}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </ContentDisplay>
  )
}

export default Tree
