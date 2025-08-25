import { getCurrentUser } from '@/lib/auth-helpers'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { CreateUniverseClient } from './create-client'
import { redirect } from 'next/navigation'

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
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <PageContainer>
        <PageHeader
          title='Create Universe'
          description='Add a new franchise universe to your collection'
        />

        <CreateUniverseClient />
      </PageContainer>
    </div>
  )
}
