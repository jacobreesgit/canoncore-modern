/**
 * Base tree types following @headless-tree/react best practices
 */

// Base tree item interface - matches database entity structure
export interface BaseTreeItem {
  id: string
  name: string
  description?: string
  order: number
  createdAt: Date
  updatedAt: Date
}

// Tree item for @headless-tree/react data loader
export interface TreeItemData extends BaseTreeItem {
  entityType: 'collection' | 'group' | 'content'
  parentId?: string | null
  isFolder: boolean
  children?: string[] // Child IDs for tree structure
  // Additional properties for different entity types
  universeId?: string
  collectionId?: string
  groupId?: string
  itemType?: string
  isViewable?: boolean
  releaseDate?: Date | null
}

// Hierarchy data structure from services
export interface HierarchyData {
  collections?: any[]
  groups?: any[]
  content?: any[]
  groupRelationships?: any[]
  contentRelationships?: any[]
}

// Tree component props
export interface TreeProps {
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

// Drop target for drag & drop
export interface DropTarget {
  parentId: string | null
  index: number
}
