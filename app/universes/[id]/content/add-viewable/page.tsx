import { getCurrentUser } from '@/lib/auth-helpers'
import {
  universeService,
  contentService,
  relationshipService,
  sourceService,
} from '@/lib/services'
import { PageLayout } from '@/components/layout/PageLayout'
import { AddViewableClient } from './add-viewable-client'
import { redirect, notFound } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Add Viewable Content Page
 * Server component for adding movies, episodes, books, etc.
 */
export default async function AddViewablePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
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

  // Check permissions - must own the universe
  if (universe.userId !== user.id) {
    throw new Error(
      'You do not have permission to add content to this universe'
    )
  }

  // Fetch existing content for parent selection
  const existingContent = await contentService.getByUniverse(id)

  // Fetch relationships for hierarchical display
  const relationships = await relationshipService.getByUniverse(id)

  // Fetch sources for the universe
  const sources = await sourceService.getByUniverse(id, user.id)

  // Get suggested parent from query params
  const parentId = resolvedSearchParams.parent as string | undefined
  const suggestedParent = parentId
    ? existingContent.find(c => c.id === parentId) || null
    : null

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Add Viewable Content',
        description: 'Add movies, episodes, books, or other viewable content',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: universe.name, href: `/universes/${id}` },
          {
            label: 'Add Viewable Content',
            href: `/universes/${id}/content/add-viewable`,
          },
        ],
      }}
    >
      <AddViewableClient
        universe={universe}
        existingContent={existingContent}
        relationships={relationships}
        suggestedParent={suggestedParent}
        sources={sources}
      />
    </PageLayout>
  )
}
