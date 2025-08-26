import { notFound } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-helpers'
import { userService, universeService } from '@/lib/services'
import { ProfileDisplay } from '@/components/profile/ProfileDisplay'
import { getUserFavouritesAction } from '@/lib/actions/favourites-actions'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

interface ProfilePageProps {
  params: Promise<{ userId: string }>
}

/**
 * User Profile Page - Server Component
 *
 * Displays user profile information including:
 * - Basic user information
 * - Universe statistics
 * - Favourites (universes and content)
 * - Permission-based edit access
 */
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { userId } = await params
  const session = await getCurrentSession()

  try {
    // Fetch user data - no caching
    const user = await userService.getById(userId)

    if (!user) {
      notFound()
    }

    // Check if current user can edit this profile
    const canEdit = session?.user?.id === userId

    // Get user's public universes - no caching
    const userUniverses = await universeService.getByUserId(userId)
    const publicUniverses = userUniverses.filter(u => u.isPublic)

    // Get actual favourites count from server for current user
    let favouritesCount = 0
    if (session?.user?.id) {
      const favouritesResult = await getUserFavouritesAction()
      if (favouritesResult.success && favouritesResult.data) {
        favouritesCount =
          favouritesResult.data.universes.length +
          favouritesResult.data.content.length
      }
    }

    return (
      <ProfileDisplay
        user={user}
        canEdit={canEdit}
        publicUniverses={publicUniverses}
        favouritesCount={favouritesCount}
      />
    )
  } catch (error) {
    // Don't log NEXT_HTTP_ERROR_FALLBACK errors to reduce noise
    if (
      error instanceof Error &&
      !error.message.includes('NEXT_HTTP_ERROR_FALLBACK')
    ) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error loading profile:', error)
      }
    }
    notFound()
  }
}
