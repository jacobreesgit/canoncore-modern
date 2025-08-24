import { getCurrentUser } from '@/lib/auth-helpers'
import {
  universeService,
  userService,
  contentService,
  relationshipService,
} from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { UniverseClient } from './universe-client'
import { redirect, notFound } from 'next/navigation'
import type { HierarchyNode } from '@/lib/utils/progress'

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

  // Fetch universe data
  const universe = await universeService.getById(id)
  if (!universe) {
    notFound()
  }

  // Check permissions - must be public or owned by user
  if (!universe.isPublic && universe.userId !== user.id) {
    throw new Error('You do not have permission to view this universe')
  }

  // Fetch universe owner
  const universeOwner = await userService.getById(universe.userId)

  // Get user's favourites to add favourite status
  const favourites = await userService.getUserFavourites(user.id)
  const universeWithFavourite = {
    ...universe,
    isFavourite: favourites.universes.includes(universe.id),
  }

  // Fetch content for this universe
  const content = await contentService.getByUniverse(id)

  // Add favourite status to content
  const contentWithFavourites = content.map(item => ({
    ...item,
    isFavourite: favourites.content.includes(item.id),
  }))

  // Build hierarchy relationships
  const relationships = await relationshipService.getByUniverse(id)
  const rawHierarchyTree = relationshipService.buildHierarchyTree(
    contentWithFavourites,
    relationships
  )

  // Convert to HierarchyNode format for Tree component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transformToHierarchyNodes = (nodes: any[]): HierarchyNode[] => {
    return nodes.map(node => ({
      contentId: node.id,
      children: node.children ? transformToHierarchyNodes(node.children) : [],
    }))
  }

  const hierarchyTree = transformToHierarchyNodes(rawHierarchyTree)

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <UniverseClient
        universe={universeWithFavourite}
        universeOwner={universeOwner}
        content={contentWithFavourites}
        hierarchyTree={hierarchyTree}
        userId={user.id}
      />
    </div>
  )
}
