import type { Content } from '@/lib/db/schema'

export interface ContentWithProgress {
  id: string
  isViewable: boolean
  progress?: number
  calculatedProgress?: number
  children?: ContentWithProgress[]
}

export interface HierarchyNode {
  contentId: string
  children: HierarchyNode[]
}

export interface ProgressCalculation {
  totalItems: number
  completedItems: number
  percentage: number
}

/**
 * Calculate progress for a single content item
 */
export function getContentProgress(content: ContentWithProgress): number {
  if (content.isViewable) {
    return content.progress || 0
  }
  return content.calculatedProgress || 0
}

/**
 * Calculate progress for organisational content based on children
 */
export function calculateOrganisationalProgress(
  children: ContentWithProgress[]
): ProgressCalculation {
  if (!children || children.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      percentage: 0,
    }
  }

  const viewableChildren = children.filter(child => child.isViewable)

  if (viewableChildren.length === 0) {
    // If no viewable children, calculate based on organisational children
    const organisationalChildren = children.filter(child => !child.isViewable)
    const childProgressions = organisationalChildren.map(child =>
      calculateOrganisationalProgress(child.children || [])
    )

    const totalItems = childProgressions.reduce(
      (sum, prog) => sum + prog.totalItems,
      0
    )
    const completedItems = childProgressions.reduce(
      (sum, prog) => sum + prog.completedItems,
      0
    )

    return {
      totalItems,
      completedItems,
      percentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
    }
  }

  // Calculate based on viewable children progress
  const totalProgress = viewableChildren.reduce((sum, child) => {
    return sum + (child.progress || 0)
  }, 0)

  const averageProgress = totalProgress / viewableChildren.length
  const completedItems = viewableChildren.filter(
    child => (child.progress || 0) >= 100
  ).length

  return {
    totalItems: viewableChildren.length,
    completedItems,
    percentage: averageProgress,
  }
}

/**
 * Calculate universe progress based on all content
 */
export function calculateUniverseProgress(
  allContent: ContentWithProgress[]
): ProgressCalculation {
  const topLevelContent = allContent.filter(
    content => !content.children?.length || content.children.length === 0
  )

  if (topLevelContent.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      percentage: 0,
    }
  }

  const viewableContent = topLevelContent.filter(content => content.isViewable)

  if (viewableContent.length === 0) {
    // Calculate based on organisational content
    const organisationalContent = topLevelContent.filter(
      content => !content.isViewable
    )
    const progressions = organisationalContent.map(content =>
      calculateOrganisationalProgress(content.children || [])
    )

    const completedProgress = progressions.reduce(
      (sum, prog) => sum + prog.percentage,
      0
    )

    return {
      totalItems: organisationalContent.length,
      completedItems: Math.round(
        (completedProgress / organisationalContent.length / 100) *
          organisationalContent.length
      ),
      percentage:
        organisationalContent.length > 0
          ? completedProgress / organisationalContent.length
          : 0,
    }
  }

  // Calculate based on viewable content
  const totalProgress = viewableContent.reduce((sum, content) => {
    return sum + (content.progress || 0)
  }, 0)

  const averageProgress = totalProgress / viewableContent.length
  const completedItems = viewableContent.filter(
    content => (content.progress || 0) >= 100
  ).length

  return {
    totalItems: viewableContent.length,
    completedItems,
    percentage: averageProgress,
  }
}

/**
 * Format progress as text
 */
export function formatProgressText(calculation: ProgressCalculation): string {
  const { percentage } = calculation
  return `${Math.round(percentage)}%`
}

/**
 * Check if content is fully completed
 */
export function isContentCompleted(content: ContentWithProgress): boolean {
  if (content.isViewable) {
    return (content.progress || 0) >= 100
  }

  const calculation = calculateOrganisationalProgress(content.children || [])
  return calculation.percentage >= 100
}

/**
 * Convert hierarchy tree to ContentWithProgress format
 */
export function convertHierarchyToProgress(
  hierarchyTree: HierarchyNode[],
  contentItems: Content[],
  progressMap: Map<string, number>
): ContentWithProgress[] {
  const contentMap = new Map(contentItems.map(item => [item.id, item]))

  const convertNode = (node: HierarchyNode): ContentWithProgress | null => {
    const content = contentMap.get(node.contentId)
    if (!content) return null

    const children = node.children
      .map(convertNode)
      .filter((child): child is ContentWithProgress => child !== null)

    const progress = progressMap.get(content.id) || 0
    let calculatedProgress = 0

    // Calculate progress for organisational content
    if (!content.isViewable && children.length > 0) {
      const calculation = calculateOrganisationalProgress(children)
      calculatedProgress = calculation.percentage
    }

    return {
      id: content.id,
      isViewable: content.isViewable,
      progress,
      calculatedProgress,
      children,
    }
  }

  return hierarchyTree
    .map(convertNode)
    .filter((node): node is ContentWithProgress => node !== null)
}

/**
 * Calculate progress for a specific content item using hierarchy
 */
export function calculateContentProgressWithHierarchy(
  contentId: string,
  hierarchyTree: HierarchyNode[],
  contentItems: Content[],
  progressMap: Map<string, number>
): number {
  const progressTree = convertHierarchyToProgress(
    hierarchyTree,
    contentItems,
    progressMap
  )

  // Find the content in the tree
  const findContentInTree = (
    nodes: ContentWithProgress[],
    targetId: string
  ): ContentWithProgress | null => {
    for (const node of nodes) {
      if (node.id === targetId) return node
      const found = findContentInTree(node.children || [], targetId)
      if (found) return found
    }
    return null
  }

  // Also check unorganized content (not in hierarchy)
  const contentMap = new Map(contentItems.map(item => [item.id, item]))
  const content = contentMap.get(contentId)
  if (content) {
    const progress = progressMap.get(contentId) || 0

    // If it's viewable content, return direct progress
    if (content.isViewable) {
      return progress
    }

    // If it's organisational content, try to find it in hierarchy
    const treeContent = findContentInTree(progressTree, contentId)
    if (treeContent) {
      return treeContent.calculatedProgress || 0
    }
  }

  return 0
}

/**
 * Calculate universe progress using hierarchy
 */
export function calculateUniverseProgressWithHierarchy(
  hierarchyTree: HierarchyNode[],
  contentItems: Content[],
  progressMap: Map<string, number>
): ProgressCalculation {
  // Get all viewable content items (both in hierarchy and unorganized)
  const allViewableContent = contentItems.filter(item => item.isViewable)

  if (allViewableContent.length === 0) {
    return {
      totalItems: 0,
      completedItems: 0,
      percentage: 0,
    }
  }

  // Calculate average progress of all viewable content
  const totalProgress = allViewableContent.reduce((sum, content) => {
    return sum + (progressMap.get(content.id) || 0)
  }, 0)

  const averageProgress = totalProgress / allViewableContent.length
  const completedItems = allViewableContent.filter(
    content => (progressMap.get(content.id) || 0) >= 100
  ).length

  return {
    totalItems: allViewableContent.length,
    completedItems,
    percentage: averageProgress,
  }
}
