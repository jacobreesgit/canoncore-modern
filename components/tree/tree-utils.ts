/**
 * Tree utilities for transforming database hierarchy data into @headless-tree/react format
 */

import { TreeItemData, HierarchyData } from './tree-types'

/**
 * Build hierarchical tree structure from flat data and relationships
 * Following @headless-tree/react data loader pattern
 */
export class TreeDataBuilder {
  private itemsMap: Map<string, TreeItemData> = new Map()
  private childrenMap: Map<string, string[]> = new Map()

  constructor(hierarchyData: HierarchyData) {
    this.buildItemsMap(hierarchyData)
    this.buildChildrenMap(hierarchyData)
  }

  /**
   * Transform database entities into TreeItemData format
   */
  private buildItemsMap(data: HierarchyData) {
    // Transform collections
    if (data.collections) {
      data.collections.forEach(collection => {
        this.itemsMap.set(collection.id, {
          ...collection,
          entityType: 'collection',
          isFolder: true,
          children: [],
        })
      })
    }

    // Transform groups
    if (data.groups) {
      data.groups.forEach(group => {
        this.itemsMap.set(group.id, {
          ...group,
          entityType: 'group',
          isFolder: true,
          children: [],
        })
      })
    }

    // Transform content
    if (data.content) {
      data.content.forEach(contentItem => {
        this.itemsMap.set(contentItem.id, {
          ...contentItem,
          entityType: 'content',
          isFolder: false, // Content can have children but starts as leaf
          children: [],
        })
      })
    }
  }

  /**
   * Build parent-child relationships from relationship tables
   */
  private buildChildrenMap(data: HierarchyData) {
    // Build collection -> groups relationships
    if (data.groups) {
      data.groups.forEach(group => {
        if (group.collectionId) {
          const children = this.childrenMap.get(group.collectionId) || []
          children.push(group.id)
          this.childrenMap.set(group.collectionId, children)
        }
      })
    }

    // Build group -> content relationships (direct)
    if (data.content) {
      data.content.forEach(contentItem => {
        if (contentItem.groupId) {
          const children = this.childrenMap.get(contentItem.groupId) || []
          children.push(contentItem.id)
          this.childrenMap.set(contentItem.groupId, children)
        }
      })
    }

    // Build group hierarchical relationships
    if (data.groupRelationships) {
      data.groupRelationships.forEach(relationship => {
        const parentId = relationship.parentGroupId
        const childId = relationship.childGroupId

        const children = this.childrenMap.get(parentId) || []
        children.push(childId)
        this.childrenMap.set(parentId, children)

        // Update parent item to be a folder
        const parentItem = this.itemsMap.get(parentId)
        if (parentItem) {
          parentItem.isFolder = true
        }
      })
    }

    // Build content hierarchical relationships
    if (data.contentRelationships) {
      data.contentRelationships.forEach(relationship => {
        const parentId = relationship.parentContentId
        const childId = relationship.childContentId

        const children = this.childrenMap.get(parentId) || []
        children.push(childId)
        this.childrenMap.set(parentId, children)

        // Update parent item to be a folder
        const parentItem = this.itemsMap.get(parentId)
        if (parentItem) {
          parentItem.isFolder = true
        }
      })
    }

    // Sort children by order
    this.childrenMap.forEach(children => {
      children.sort((a, b) => {
        const itemA = this.itemsMap.get(a)
        const itemB = this.itemsMap.get(b)
        if (!itemA || !itemB) return 0
        return itemA.order - itemB.order
      })
    })
  }

  /**
   * Data loader functions for @headless-tree/react
   */
  getDataLoader() {
    return {
      getItem: (itemId: string): TreeItemData | null => {
        return this.itemsMap.get(itemId) || null
      },
      getChildren: (itemId: string): string[] => {
        return this.childrenMap.get(itemId) || []
      },
    }
  }

  /**
   * Get root items (items without parents)
   */
  getRootItems(): string[] {
    const allChildren = new Set<string>()
    this.childrenMap.forEach(children => {
      children.forEach(child => allChildren.add(child))
    })

    const rootItems: string[] = []
    this.itemsMap.forEach((_, id) => {
      if (!allChildren.has(id)) {
        rootItems.push(id)
      }
    })

    return rootItems.sort((a, b) => {
      const itemA = this.itemsMap.get(a)
      const itemB = this.itemsMap.get(b)
      if (!itemA || !itemB) return 0
      return itemA.order - itemB.order
    })
  }

  /**
   * Get all items map for debugging
   */
  getAllItems(): Map<string, TreeItemData> {
    return this.itemsMap
  }
}
