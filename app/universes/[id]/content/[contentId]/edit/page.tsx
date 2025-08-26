import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService, contentService } from '@/lib/services'
import { PageLayout } from '@/components/layout/PageLayout'
import { EditContentClient } from './edit-content-client'
import { redirect, notFound } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Edit Content Page
 * Server component with authentication and permission checks
 */
export default async function EditContentPage({
  params,
}: {
  params: Promise<{ id: string; contentId: string }>
}) {
  const { id, contentId } = await params
  const user = await getCurrentUser()

  // Redirect unauthenticated users
  if (!user || !user.id) {
    redirect('/')
  }

  // Fetch universe and content data
  const universe = await universeService.getById(id)
  if (!universe) {
    notFound()
  }

  const content = await contentService.getById(contentId)
  if (!content) {
    notFound()
  }

  // Check permissions - must own the universe and content
  if (
    universe.userId !== user.id ||
    content.userId !== user.id ||
    content.universeId !== id
  ) {
    notFound()
  }

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Edit Content',
        description: 'Update content information',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: universe.name, href: `/universes/${id}` },
          { label: content.name, href: `/content/${contentId}` },
          {
            label: 'Edit',
            href: `/universes/${id}/content/${contentId}/edit`,
          },
        ],
      }}
    >
      <EditContentClient content={content} />
    </PageLayout>
  )
}
