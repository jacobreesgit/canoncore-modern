import { getCurrentUser } from '@/lib/auth-helpers'
import { PageLayout } from '@/components/layout/PageLayout'
import { CreateUniverseClient } from './create-client'
import { redirect } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Create Universe Page
 * Server component that handles authentication and renders the create form
 */
export default async function CreateUniversePage() {
  const user = await getCurrentUser()

  // Redirect unauthenticated users
  if (!user) {
    redirect('/')
  }

  return (
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Create Universe',
        description: 'Add a new franchise universe to your collection',
      }}
    >
      <CreateUniverseClient />
    </PageLayout>
  )
}
