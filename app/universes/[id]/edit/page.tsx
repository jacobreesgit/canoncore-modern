import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService } from '@/lib/services'
import { PageLayout } from '@/components/layout/PageLayout'
import { EditUniverseClient } from './edit-client'
import { redirect, notFound } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

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
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Edit Universe',
        description: 'Update your universe information',
        breadcrumbs: [
          { label: 'Dashboard', href: '/dashboard' },
          { label: universe.name, href: `/universes/${id}` },
          { label: 'Edit', href: `/universes/${id}/edit` },
        ],
      }}
    >
      <EditUniverseClient universe={universe} />
    </PageLayout>
  )
}
