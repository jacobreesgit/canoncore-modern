import { notFound } from 'next/navigation'
import { getCurrentSession } from '@/lib/auth-helpers'
import { userService, universeService } from '@/lib/services'
import { ProfileDisplay } from '@/components/profile/ProfileDisplay'

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
    // Fetch user data
    const user = await userService.getById(userId)

    if (!user) {
      notFound()
    }

    // Check if current user can edit this profile
    const canEdit = session?.user?.id === userId

    // Get user statistics (universes, favourites count)
    const stats = await userService.getProfileStats(userId)

    // Get user's public universes
    const userUniverses = await universeService.getByUserId(userId)
    const publicUniverses = userUniverses.filter(u => u.isPublic)

    return (
      <ProfileDisplay
        user={user}
        stats={stats}
        canEdit={canEdit}
        publicUniverses={publicUniverses}
      />
    )
  } catch (error) {
    console.error('Error loading profile:', error)
    notFound()
  }
}
