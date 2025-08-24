import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService, contentService } from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EditContentClient } from './edit-content-client'
import { redirect, notFound } from 'next/navigation'

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
    throw new Error('You do not have permission to edit this content')
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <PageContainer>
        <PageHeader
          title='Edit Content'
          description='Update content information'
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: universe.name, href: `/universes/${id}` },
            { label: content.name, href: `/content/${contentId}` },
            {
              label: 'Edit',
              href: `/universes/${id}/content/${contentId}/edit`,
            },
          ]}
        />

        <EditContentClient content={content} />
      </PageContainer>
    </div>
  )
}
