import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService } from '@/lib/services'
import { redirect } from 'next/navigation'
import { DashboardClient } from './dashboard-client'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Dashboard page showing user's universes with quick actions
 * Server component with server-side data fetching for performance
 */
export default async function DashboardPage() {
  const user = await getCurrentUser()

  // Redirect unauthenticated users to homepage
  if (!user) {
    redirect('/')
  }

  // Fetch user's universes and statistics
  if (!user.id) {
    throw new Error('User ID is required')
  }

  const universes = await universeService.getByUserId(user.id)

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      }}
      universes={universes}
    />
  )
}
