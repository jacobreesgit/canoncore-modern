'use client'

/**
 * Base tree component following @headless-tree/react best practices
 */

import { useTree } from '@headless-tree/react'
import {
  syncDataLoaderFeature,
  dragAndDropFeature,
  selectionFeature,
  hotkeysCoreFeature,
  createOnDropHandler,
} from '@headless-tree/core'
import { cn } from '@/lib/utils'
import { TreeItemData, HierarchyData } from './tree-types'
import { TreeDataBuilder } from './tree-utils'
import { ChevronRight, ChevronDown, Folder, File } from 'lucide-react'

interface BaseTreeProps {
  hierarchyData: HierarchyData
  onReorder?: (items: { id: string; newOrder: number }[]) => Promise<void>
  onMove?: (
    itemId: string,
    newParentId: string | null,
    newOrder: number
  ) => Promise<void>
  onSelect?: (itemId: string) => void
  className?: string
}

export function BaseTree({
  hierarchyData,
  onReorder,
  onSelect,
  className,
}: BaseTreeProps) {
  // Build tree data structure
  const treeBuilder = new TreeDataBuilder(hierarchyData)
  const dataLoader = treeBuilder.getDataLoader()
  const rootItems = treeBuilder.getRootItems()

  // Initialize tree with @headless-tree/react
  const tree = useTree<TreeItemData>({
    rootItemId: 'root',
    getItemName: item => item.getItemData()?.name || 'Unknown',
    isItemFolder: item => item.getItemData()?.isFolder || false,
    dataLoader: {
      getItem: (itemId: string): TreeItemData => {
        if (itemId === 'root') {
          return {
            id: 'root',
            name: 'Root',
            entityType: 'collection' as const,
            isFolder: true,
            order: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        }
        const item = dataLoader.getItem(itemId)
        if (!item) {
          throw new Error(`Item not found: ${itemId}`)
        }
        return item
      },
      getChildren: (itemId: string) => {
        if (itemId === 'root') {
          return rootItems
        }
        return dataLoader.getChildren(itemId)
      },
    },
    indent: 20,
    canReorder: true,
    onDrop: createOnDropHandler(async (_, newChildren) => {
      // Handle reordering and moving
      if (onReorder && newChildren) {
        const orderUpdates = newChildren.map((childId, index) => ({
          id: childId,
          newOrder: index,
        }))
        await onReorder(orderUpdates)
      }
    }),
    onPrimaryAction: item => {
      if (onSelect) {
        const itemId = item.getItemMeta().itemId
        if (itemId !== 'root') {
          onSelect(itemId)
        }
      }
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      dragAndDropFeature,
      hotkeysCoreFeature,
    ],
  })

  const TreeItem = ({ item }: { item: any }) => {
    const itemData = item.getItemData()
    const isExpanded = item.isExpanded()
    const isFocused = item.isFocused()
    const isSelected = item.isSelected()
    const isFolder = item.isFolder()
    const level = item.getItemMeta().level

    if (!itemData || itemData.id === 'root') {
      return null
    }

    return (
      <button
        {...item.getProps()}
        className={cn(
          'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm transition-colors',
          'hover:bg-muted/50 focus:bg-muted focus:outline-none',
          {
            'bg-muted': isFocused,
            'bg-accent text-accent-foreground': isSelected,
          }
        )}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
      >
        {/* Expand/collapse icon */}
        {isFolder && (
          <div className="flex h-4 w-4 items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </div>
        )}
        {!isFolder && <div className="h-4 w-4" />}

        {/* Item type icon */}
        <div className="flex h-4 w-4 items-center justify-center">
          {isFolder ? (
            <Folder className="h-3 w-3 text-muted-foreground" />
          ) : (
            <File className="h-3 w-3 text-muted-foreground" />
          )}
        </div>

        {/* Item name */}
        <span className="flex-1 truncate">{itemData.name}</span>

        {/* Entity type badge */}
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {itemData.entityType}
        </span>
      </button>
    )
  }

  return (
    <div className={cn('relative', className)}>
      <div
        {...tree.getContainerProps()}
        className="space-y-0.5 rounded-md border bg-background p-2"
      >
        {tree.getItems().map(item => (
          <TreeItem key={item.getId()} item={item} />
        ))}

        {/* Drag line for visual feedback */}
        <div
          style={tree.getDragLineStyle()}
          className="pointer-events-none h-0.5 bg-primary transition-all"
        />
      </div>
    </div>
  )
}
