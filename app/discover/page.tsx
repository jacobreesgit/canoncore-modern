import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService, userService } from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { DiscoverClient } from './discover-client'

/**
 * Discover page showing public universes with search functionality
 * Server component with server-side data fetching for SEO and performance
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  const user = await getCurrentUser()
  const { q: searchQuery, sort } = await searchParams

  // Fetch public universes with optional search
  const publicUniverses = await universeService.getPublicUniverses({
    searchQuery,
    sortBy: sort as 'newest' | 'oldest' | 'name' | undefined,
  })

  // Get user's favorites if authenticated
  let userFavorites: string[] = []
  if (user && user.id) {
    const favorites = await userService.getUserFavourites(user.id)
    userFavorites = favorites.universes
  }

  // Fetch universe owners for display
  const uniqueUserIds = Array.from(new Set(publicUniverses.map(u => u.userId)))
  const universeOwners: Record<
    string,
    { id: string; name: string | null; email: string }
  > = {}

  for (const userId of uniqueUserIds) {
    try {
      const owner = await userService.getById(userId)
      if (owner) {
        universeOwners[userId] = owner
      }
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error)
    }
  }

  // Add favorite status to universes
  const universesWithFavorites = publicUniverses.map(universe => ({
    ...universe,
    isFavorite: userFavorites.includes(universe.id),
  }))

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='discover' />

      <PageContainer>
        <PageHeader
          title='Discover Franchises'
          description='Explore public franchise universes created by the community'
        />

        <DiscoverClient
          initialUniverses={universesWithFavorites}
          universeOwners={universeOwners}
          currentUserId={user?.id}
        />
      </PageContainer>
    </div>
  )
}
