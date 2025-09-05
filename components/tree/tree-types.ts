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

// Specific entity interfaces for hierarchy data
export interface CollectionItem {
  id: string
  name: string
  description: string
  order: number
  universeId: string
}

export interface GroupItem {
  id: string
  name: string
  description: string
  order: number
  collectionId: string
  itemType: string
}

export interface ContentItem {
  id: string
  name: string
  description: string
  order: number
  groupId: string
  isViewable: boolean
  itemType: string
  releaseDate: Date | null
}

export interface GroupRelationship {
  id: string
  parentGroupId: string
  childGroupId: string
}

export interface ContentRelationship {
  id: string
  parentContentId: string
  childContentId: string
}

// Hierarchy data structure from services with specific types
export interface HierarchyData {
  collections?: CollectionItem[]
  groups?: GroupItem[]
  content?: ContentItem[]
  groupRelationships?: GroupRelationship[]
  contentRelationships?: ContentRelationship[]
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
