import { Content } from '@/lib/types'

export interface ContentWithChildren extends Content {
  children: ContentWithChildren[]
  depth: number
}

export interface HierarchicalOption {
  id: string
  name: string
  depth: number
  displayName: string
  isViewable: boolean
  disabled: boolean
}

/**
 * Builds a hierarchical tree structure from flat content array
 */
export function buildContentHierarchy(
  allContent: Content[],
  relationships: { parentId: string | null; childId: string }[]
): ContentWithChildren[] {
  // Create a map of content by ID for quick lookups
  const contentMap = new Map<string, ContentWithChildren>()

  // Initialize all content items with empty children array and depth 0
  allContent.forEach(content => {
    contentMap.set(content.id, {
      ...content,
      children: [],
      depth: 0,
    })
  })

  // Build parent-child relationships (filter out null parentIds)
  const childrenMap = new Map<string, string[]>()
  relationships.forEach(rel => {
    if (rel.parentId) {
      if (!childrenMap.has(rel.parentId)) {
        childrenMap.set(rel.parentId, [])
      }
      childrenMap.get(rel.parentId)!.push(rel.childId)
    }
  })

  // Identify root nodes (content items without parents)
  const rootIds = new Set(allContent.map(c => c.id))
  relationships.forEach(rel => {
    if (rel.parentId) {
      rootIds.delete(rel.childId)
    }
  })

  // Recursively build hierarchy and set depths
  function buildNode(
    nodeId: string,
    currentDepth: number
  ): ContentWithChildren | null {
    const content = contentMap.get(nodeId)
    if (!content) return null

    content.depth = currentDepth
    const childIds = childrenMap.get(nodeId) || []

    content.children = childIds
      .map(childId => buildNode(childId, currentDepth + 1))
      .filter(child => child !== null) as ContentWithChildren[]

    return content
  }

  // Build the tree starting from root nodes
  return Array.from(rootIds)
    .map(rootId => buildNode(rootId, 0))
    .filter(node => node !== null) as ContentWithChildren[]
}

/**
 * Flattens hierarchical content into a list of options with visual hierarchy indicators
 */
export function createHierarchicalOptions(
  hierarchicalContent: ContentWithChildren[]
): HierarchicalOption[] {
  const options: HierarchicalOption[] = []

  function processNode(node: ContentWithChildren) {
    // Create indentation based on depth using non-breaking spaces
    const indent = '\u00A0\u00A0\u00A0\u00A0'.repeat(node.depth) // 4 non-breaking spaces per level

    options.push({
      id: node.id,
      name: node.name,
      depth: node.depth,
      displayName: `${indent}${node.name}`,
      isViewable: node.isViewable,
      disabled: node.isViewable, // Viewable content cannot be parents
    })

    // Process children
    node.children.forEach(child => processNode(child))
  }

  hierarchicalContent.forEach(rootNode => processNode(rootNode))
  return options
}

/**
 * Creates hierarchical parent options from content array
 * Shows all content in hierarchy but disables viewable content (only organizational content can be parents)
 * Excludes the specified content ID from being shown at all
 */
export function createParentOptions(
  allContent: Content[],
  relationships: { parentId: string | null; childId: string }[],
  excludeContentId?: string
): HierarchicalOption[] {
  // Filter out only the excluded content (but keep viewable content to show hierarchy)
  const filteredContent = allContent.filter(
    content => !excludeContentId || content.id !== excludeContentId
  )

  // Build hierarchy with all content
  const hierarchy = buildContentHierarchy(filteredContent, relationships)

  // Convert to flat options with hierarchy indicators
  return createHierarchicalOptions(hierarchy)
}
