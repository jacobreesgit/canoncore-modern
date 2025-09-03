import { getCurrentUser } from '@/lib/auth-helpers'
import {
  contentService,
  userService,
  relationshipService,
} from '@/lib/services'
import { ContentClient } from './content-client'
import { redirect, notFound } from 'next/navigation'
import type { HierarchyNode } from '@/lib/utils/progress'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

interface RawHierarchyNode {
  id: string
  children?: RawHierarchyNode[]
}

/**
 * Content Detail Page
 * Server component with authentication, permission checks, and data fetching
 */
export default async function ContentPage({
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

  // Fetch content data with source info - no caching
  const content = await contentService.getById(id)
  if (!content) {
    notFound()
  }

  // Get source information for this content
  const sourceInfo = await contentService.getContentSource(id)

  // Get the universe to check permissions
  const universe = await contentService.getUniverse(id)
  if (!universe) {
    notFound()
  }

  // Check permissions - must be public or owned by user
  if (!universe.isPublic && universe.userId !== user.id) {
    notFound()
  }

  // Fetch content owner - no caching
  const contentOwner = await userService.getById(content.userId)

  // Get user's favourites - no caching
  const favourites = await userService.getUserFavourites(user.id)
  const contentWithFavourite = {
    ...content,
    isFavourite: favourites.content.includes(content.id),
    // Add source info
    sourceName: sourceInfo?.sourceName,
    sourceBackgroundColor: sourceInfo?.sourceBackgroundColor,
    sourceTextColor: sourceInfo?.sourceTextColor,
  }

  // Get all content in the same universe for hierarchy context with sources
  const universeContent =
    await contentService.getByUniverseWithSourcesAndProgress(
      universe.id,
      user.id
    )
  const universeContentWithFavourites = universeContent.map(item => ({
    ...item,
    isFavourite: favourites.content.includes(item.id),
  }))

  // Build hierarchy relationships for context
  const relationships = await relationshipService.getByUniverse(universe.id)
  const rawHierarchyTree = relationshipService.buildHierarchyTree(
    universeContentWithFavourites,
    relationships
  )

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
    <ContentClient
      content={contentWithFavourite}
      contentOwner={contentOwner}
      universe={universe}
      universeContent={universeContentWithFavourites}
      hierarchyTree={hierarchyTree}
      userId={user.id}
    />
  )
}
