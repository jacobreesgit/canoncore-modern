import { getCurrentUser } from '@/lib/auth-helpers'
import {
  universeService,
  userService,
  contentService,
  relationshipService,
} from '@/lib/services'
import { UniverseClient } from './universe-client'
import { redirect, notFound } from 'next/navigation'
import type { HierarchyNode } from '@/lib/utils/progress'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

interface RawHierarchyNode {
  id: string
  children?: RawHierarchyNode[]
}

/**
 * Universe Detail Page
 * Server component with authentication, permission checks, and data fetching
 */
export default async function UniversePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()

  // Redirect unauthenticated users
  if (!user || !user.id) {
    redirect('/')
  }

  // Fetch universe data - no caching
  const universe = await universeService.getById(id)
  if (!universe) {
    notFound()
  }

  // Check permissions - must be public or owned by user
  if (!universe.isPublic && universe.userId !== user.id) {
    notFound()
  }

  // Fetch universe owner - no caching
  const universeOwner = await userService.getById(universe.userId)

  // Get user's favourites - no caching
  const favourites = await userService.getUserFavourites(user.id)
  const universeWithFavourite = {
    ...universe,
    isFavourite: favourites.universes.includes(universe.id),
  }

  // Fetch content for this universe with sources - no caching
  const content = await contentService.getByUniverseWithSourcesAndProgress(
    id,
    user.id
  )
  console.log(
    `🔍 Debug - Content fetched for universe ${id}:`,
    content.length,
    'items'
  )
  console.log(
    '📝 Content items:',
    content.map(c => ({
      id: c.id,
      name: c.name,
      itemType: c.itemType,
      isViewable: c.isViewable,
    }))
  )

  // Add favourite status to content
  const contentWithFavourites = content.map(item => ({
    ...item,
    isFavourite: favourites.content.includes(item.id),
  }))

  // Build hierarchy relationships
  const relationships = await relationshipService.getByUniverse(id)
  console.log(
    `🔗 Debug - Relationships fetched for universe ${id}:`,
    relationships.length,
    'relationships'
  )
  console.log(
    '📊 Relationships:',
    relationships.map(r => ({ parentId: r.parentId, childId: r.childId }))
  )

  const rawHierarchyTree = relationshipService.buildHierarchyTree(
    contentWithFavourites,
    relationships
  )
  console.log(`🌳 Debug - Raw hierarchy tree:`, rawHierarchyTree)

  // Convert to HierarchyNode format for Tree component
  const transformToHierarchyNodes = (
    nodes: RawHierarchyNode[]
  ): HierarchyNode[] => {
    return nodes.map(node => ({
      contentId: node.id,
      children: node.children ? transformToHierarchyNodes(node.children) : [],
    }))
  }

  const hierarchyTree = transformToHierarchyNodes(rawHierarchyTree)

  return (
    <UniverseClient
      universe={universeWithFavourite}
      universeOwner={universeOwner}
      content={contentWithFavourites}
      hierarchyTree={hierarchyTree}
      userId={user.id}
    />
  )
}
