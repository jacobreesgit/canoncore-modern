import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService, contentService } from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { AddViewableClient } from './add-viewable-client'
import { redirect, notFound } from 'next/navigation'

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

  // Get suggested parent from query params
  const parentId = resolvedSearchParams.parent as string | undefined
  const suggestedParent = parentId
    ? existingContent.find(c => c.id === parentId) || null
    : null

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <PageContainer>
        <PageHeader
          title='Add Viewable Content'
          description='Add movies, episodes, books, or other viewable content'
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: universe.name, href: `/universes/${id}` },
            {
              label: 'Add Viewable Content',
              href: `/universes/${id}/content/add-viewable`,
            },
          ]}
        />

        <AddViewableClient
          universe={universe}
          existingContent={existingContent}
          suggestedParent={suggestedParent}
        />
      </PageContainer>
    </div>
  )
}
