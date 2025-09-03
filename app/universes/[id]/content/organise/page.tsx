import { getCurrentUser } from '@/lib/auth-helpers'
import {
  universeService,
  contentService,
  relationshipService,
} from '@/lib/services'
import { PageLayout } from '@/components/layout/PageLayout'
import { OrganiseClient } from './organise-client'
import { redirect, notFound } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Add Organizational Content Page
 * Server component for adding series, phases, characters, locations, etc.
 */
export default async function OrganisePage({
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

  // Get suggested parent from query params
  const parentId = resolvedSearchParams.parent as string | undefined
  const suggestedParent = parentId
    ? existingContent.find(c => c.id === parentId) || null
    : null

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Add Organization',
        description:
          'Add series, phases, characters, locations, or other organizational content',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: universe.name, href: `/universes/${id}` },
          {
            label: 'Add Organization',
            href: `/universes/${id}/content/organise`,
          },
        ],
      }}
    >
      <OrganiseClient
        universe={universe}
        existingContent={existingContent}
        relationships={relationships}
        suggestedParent={suggestedParent}
      />
    </PageLayout>
  )
}
