import { getCurrentUser } from '@/lib/auth-helpers'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
import { universeService } from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { EditUniverseClient } from './edit-client'
import { redirect, notFound } from 'next/navigation'

/**
 * Edit Universe Page
 * Server component with authentication and permission checks
 */
export default async function EditUniversePage({
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

  // Check permissions - must own the universe
  if (universe.userId !== user.id) {
    throw new Error('You do not have permission to edit this universe')
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <PageContainer>
        <PageHeader
          title='Edit Universe'
          description='Update your universe information'
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: universe.name, href: `/universes/${id}` },
            { label: 'Edit', href: `/universes/${id}/edit` },
          ]}
        />

        <EditUniverseClient universe={universe} />
      </PageContainer>
    </div>
  )
}
