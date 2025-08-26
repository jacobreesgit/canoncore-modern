'use client'

import React, { useMemo, useCallback } from 'react'
import {
  UncontrolledTreeEnvironment,
  Tree as RCTree,
  StaticTreeDataProvider,
  TreeItem,
} from 'react-complex-tree'
import { Content } from '@/lib/types'
import { Button } from '@/components/interactive/Button'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { ProgressBar } from '@/components/content/ProgressBar'
import { Badge } from '@/components/content/Badge'
import { useProgressStore } from '@/lib/stores/progress-store'
import { type HierarchyNode } from '@/lib/utils/progress'
import { HiChevronRight } from 'react-icons/hi'
import Link from 'next/link'
import 'react-complex-tree/lib/style.css'

interface TreeItemData {
  index: string
  children?: string[]
  data: {
    title: string
    contentId?: string
    content?: Content
    isFolder?: boolean
  }
}

interface CustomTreeItems {
  [key: string]: TreeItemData
}

interface TreeNode {
  contentId: string
  children?: TreeNode[]
}

interface TreeArrowContext {
  arrowProps?: React.HTMLAttributes<HTMLElement>
  isExpanded?: boolean
}

interface TreeArrowProps {
  item: TreeItem
  context: TreeArrowContext
}

export interface TreeProps {
  /** Tree component variant */
  variant?: 'full' | 'focused'
  /** Hierarchy tree structure */
  hierarchyTree: HierarchyNode[]
  /** All content items */
  content: Content[]
  /** Function to generate href for content items */
  contentHref: (content: Content) => string
  /** Current search query */
  searchQuery?: string
  /** Filtered content for search results */
  filteredContent?: Content[]
  /** Content ID to highlight for focused variant */
  highlightedContentId?: string
  /** Optional custom class names */
  className?: string
}

export function Tree({
  variant = 'full',
  hierarchyTree,
  content,
  contentHref,
  searchQuery = '',
  filteredContent = [],
  highlightedContentId,
  className = '',
}: TreeProps) {
  const { getProgress, getContentProgressWithHierarchy } = useProgressStore()

  // Use hierarchyTree directly as it's already in HierarchyNode format
  const hierarchyNodes = hierarchyTree

  // Helper function to find content in hierarchy
  const findContentInHierarchy = useCallback(
    (node: TreeNode, contentId: string): boolean => {
      if (node.contentId === contentId) return true
      if (node.children) {
        return node.children.some((child: TreeNode) =>
          findContentInHierarchy(child, contentId)
        )
      }
      return false
    },
    []
  )

  // Convert hierarchy tree to react-complex-tree format
  const treeData = useMemo(() => {
    const items: CustomTreeItems = {}

    // Add root item
    items.root = {
      index: 'root',
      data: {
        title: 'Root',
        isFolder: true,
      },
      children: [],
    }

    // Helper function to process hierarchy nodes
    const processNode = (node: TreeNode, parentId: string = 'root') => {
      const contentItem = content.find(c => c.id === node.contentId)
      if (!contentItem) return

      const itemId = node.contentId
      const hasChildren = node.children && node.children.length > 0

      // Calculate progress - use hierarchy-aware calculation for organisational content
      const progress = contentItem.isViewable
        ? getProgress(contentItem.id)
        : getContentProgressWithHierarchy(
            contentItem.id,
            hierarchyNodes,
            content
          )

      items[itemId] = {
        index: itemId,
        data: {
          title: contentItem.name,
          contentId: contentItem.id,
          content: { ...contentItem, progress } as Content & {
            progress: number
          },
          isFolder: hasChildren,
        },
        children: hasChildren
          ? node.children?.map((child: TreeNode) => child.contentId) || []
          : [],
      }

      // Add to parent's children
      if (items[parentId]) {
        items[parentId].children = items[parentId].children || []
        if (!items[parentId].children!.includes(itemId)) {
          items[parentId].children!.push(itemId)
        }
      }

      // Process children recursively
      if (hasChildren && node.children) {
        node.children.forEach((child: TreeNode) => processNode(child, itemId))
      }
    }

    // Process hierarchy tree
    hierarchyTree.forEach(node => processNode(node))

    // Add unorganized content at root level
    const unorganizedContent = content.filter(item => {
      return !hierarchyTree.some(node => findContentInHierarchy(node, item.id))
    })

    unorganizedContent.forEach(item => {
      const progress = item.isViewable
        ? getProgress(item.id)
        : getContentProgressWithHierarchy(item.id, hierarchyNodes, content)

      items[item.id] = {
        index: item.id,
        data: {
          title: item.name,
          contentId: item.id,
          content: { ...item, progress } as Content & { progress: number },
          isFolder: false,
        },
        children: [],
      }

      items.root.children!.push(item.id)
    })

    return items
  }, [
    hierarchyTree,
    content,
    getProgress,
    getContentProgressWithHierarchy,
    hierarchyNodes,
    findContentInHierarchy,
  ])

  // Create data provider
  const dataProvider = useMemo(() => {
    return new StaticTreeDataProvider(treeData)
  }, [treeData])

  // Calculate initial view state
  const initialViewState = useMemo(() => {
    const expandedItems: string[] = []

    if (variant === 'full') {
      // Expand all folders by default in full view
      Object.keys(treeData).forEach(key => {
        if (treeData[key].data.isFolder) {
          expandedItems.push(key)
        }
      })
    } else if (variant === 'focused' && highlightedContentId) {
      // In focused view, expand path to highlighted content
      const findPathToContent = (
        nodeId: string,
        targetId: string,
        path: string[] = []
      ): string[] => {
        const currentPath = [...path, nodeId]

        if (nodeId === targetId) {
          return currentPath
        }

        const node = treeData[nodeId]
        if (node && node.children) {
          for (const childId of node.children) {
            const result = findPathToContent(childId, targetId, currentPath)
            if (result.length > 0 && result[result.length - 1] === targetId) {
              return result
            }
          }
        }

        return []
      }

      const pathToHighlighted = findPathToContent('root', highlightedContentId)
      expandedItems.push(...pathToHighlighted.slice(0, -1)) // Don't expand the target itself
    }

    return {
      'tree-1': {
        expandedItems,
        focusedItem: highlightedContentId || undefined,
        selectedItems: highlightedContentId ? [highlightedContentId] : [],
      },
    }
  }, [variant, highlightedContentId, treeData])

  // Custom item renderer
  const renderItem = useCallback(
    (props: {
      item: TreeItem
      depth: number
      children: React.ReactNode
      title: React.ReactNode
      context: unknown
      arrow: React.ReactNode
    }) => {
      const { item, arrow, children } = props
      const content = item.data.content as Content & { progress: number }
      const isHighlighted = highlightedContentId === content.id
      const progress = content.progress

      return (
        <div
          className={`flex items-center ${
            isHighlighted
              ? 'bg-primary-50 border-2 border-primary-100 rounded-lg shadow-sm'
              : 'hover:bg-neutral-50 transition-colors rounded-lg'
          }`}
        >
          {/* Expand arrow */}
          <div className='flex-shrink-0 w-6 flex justify-center'>{arrow}</div>

          {/* Content link */}
          <div className='flex-1 min-w-0'>
            <Link
              href={contentHref(content)}
              className='flex items-center px-2 py-3 cursor-pointer'
            >
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-neutral-900 truncate'>
                  {content.name}
                </div>
                <div className='flex items-center gap-2 mt-1'>
                  <Badge
                    variant={content.isViewable ? 'info' : 'organisational'}
                    size='small'
                  >
                    {content.isViewable ? 'Viewable' : 'Organisational'}
                  </Badge>
                  {content.mediaType && (
                    <Badge variant='organisational' size='small'>
                      {content.mediaType.charAt(0).toUpperCase() +
                        content.mediaType.slice(1)}
                    </Badge>
                  )}
                </div>
              </div>
            </Link>
          </div>

          {/* Progress and favourite */}
          <div className='flex items-center gap-2 px-2'>
            {content.isViewable && (
              <div className='w-20'>
                <ProgressBar
                  value={progress}
                  variant={content.isViewable ? 'viewable' : 'organisational'}
                  size='default'
                />
              </div>
            )}
            <div className='text-xs text-neutral-600 w-12 text-right'>
              {Math.round(progress)}%
            </div>
            <FavouriteButton
              targetId={content.id}
              targetType='content'
              size='small'
            />
          </div>

          {/* Children container */}
          {children}
        </div>
      )
    },
    [contentHref, highlightedContentId]
  )

  // Custom arrow renderer
  const renderItemArrow = useCallback((props: TreeArrowProps) => {
    const { item, context } = props
    if (!item.data.isFolder || !context.arrowProps) return null

    return (
      <Button
        variant='clear'
        size='small'
        {...context.arrowProps}
        className='p-1'
      >
        <HiChevronRight
          className={`w-4 h-4 transition-transform ${
            context.isExpanded ? 'rotate-90' : ''
          }`}
        />
      </Button>
    )
  }, [])

  // Handle search results
  if (searchQuery && filteredContent.length > 0) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className='text-sm text-neutral-600 mb-4'>
          {filteredContent.length} result
          {filteredContent.length === 1 ? '' : 's'} for {`"${searchQuery}"`}
        </div>
        {filteredContent.map(item => (
          <div
            key={item.id}
            className='flex items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-neutral-200'
          >
            <div className='flex-1 min-w-0'>
              <Link
                href={contentHref(item)}
                className='flex items-center cursor-pointer'
              >
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-neutral-900 truncate'>
                    {item.name}
                  </div>
                  <div className='flex items-center gap-2 mt-1'>
                    <Badge
                      variant={item.isViewable ? 'info' : 'organisational'}
                      size='small'
                    >
                      {item.isViewable ? 'Viewable' : 'Organisational'}
                    </Badge>
                    {item.mediaType && (
                      <Badge variant='organisational' size='small'>
                        {item.mediaType.charAt(0).toUpperCase() +
                          item.mediaType.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>
              </Link>
            </div>
            <div className='flex items-center gap-2 ml-4'>
              {item.isViewable && (
                <div className='w-20'>
                  <ProgressBar
                    value={getProgress(item.id)}
                    variant={item.isViewable ? 'viewable' : 'organisational'}
                    size='default'
                  />
                </div>
              )}
              <div className='text-xs text-neutral-600 w-12 text-right'>
                {Math.round(getProgress(item.id))}%
              </div>
              <FavouriteButton
                targetId={item.id}
                targetType='content'
                size='small'
              />
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Handle empty state
  if (!treeData.root.children || treeData.root.children.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className='text-neutral-500'>
          <h3 className='text-lg font-medium text-neutral-900 mb-2'>
            No content hierarchy
          </h3>
          <p className='text-sm'>
            No hierarchical relationships defined yet. Create relationships by
            setting parent content when adding new items.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`tree-container ${className}`}>
      <UncontrolledTreeEnvironment
        dataProvider={dataProvider}
        getItemTitle={item => item.data.name}
        viewState={initialViewState}
        renderItem={renderItem}
        renderItemArrow={renderItemArrow}
        canDragAndDrop={false}
        canDropOnFolder={false}
        canReorderItems={false}
        canRename={false}
        canSearch={false}
      >
        <RCTree treeId='tree-1' rootItem='root' treeLabel='Content Hierarchy' />
      </UncontrolledTreeEnvironment>

      <style jsx>{`
        .tree-container {
          min-height: 200px;
        }

        .tree-container :global(.rct-tree) {
          height: auto;
          min-height: 200px;
          background: transparent;
        }

        .tree-container :global(.rct-tree-item-li) {
          margin: 2px 0;
        }

        .tree-container :global(.rct-tree-item-button) {
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
          width: 100% !important;
          height: auto !important;
        }

        .tree-container :global(.rct-tree-item-title-container) {
          display: none;
        }

        .tree-container :global(.rct-tree-item-arrow) {
          display: none;
        }

        .tree-container :global(.rct-tree-items-container) {
          padding-left: 24px;
        }
      `}</style>
    </div>
  )
}

export default Tree
