import { getCurrentUser } from '@/lib/auth-helpers'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
import {
  contentService,
  universeService,
  relationshipService,
  userService,
} from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { ContentClient } from './content-client'
import { redirect, notFound } from 'next/navigation'

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

  // Fetch content data
  const content = await contentService.getById(id)
  if (!content) {
    notFound()
  }

  // Fetch universe data
  const universe = await universeService.getById(content.universeId)
  if (!universe) {
    notFound()
  }

  // Check permissions - must be public universe or owned by user
  if (!universe.isPublic && universe.userId !== user.id) {
    throw new Error('You do not have permission to view this content')
  }

  // Get user's favourites to add favourite status
  const favourites = await userService.getUserFavourites(user.id)
  const contentWithFavourite = {
    ...content,
    isFavourite: favourites.content.includes(content.id),
  }

  // Get parent and child relationships
  const parents = await relationshipService.getParents(id)
  const children = await relationshipService.getChildren(id)

  // Fetch parent and child content details
  const parentContent = []
  for (const parent of parents) {
    if (parent.parentId) {
      const parentItem = await contentService.getById(parent.parentId)
      if (parentItem) {
        parentContent.push(parentItem)
      }
    }
  }

  const childContent = []
  for (const child of children) {
    const childItem = await contentService.getById(child.childId)
    if (childItem) {
      childContent.push(childItem)
    }
  }

  return (
    <div className='min-h-screen bg-surface'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <ContentClient
        content={contentWithFavourite}
        universe={universe}
        parentContent={parentContent}
        childContent={childContent}
        canEdit={universe.userId === user.id}
      />
    </div>
  )
}
