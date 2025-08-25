import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService, userService, Universe } from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { DiscoverClient } from './discover-client'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Discover page showing public universes with search functionality
 * Server component with server-side data fetching for SEO and performance
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string }>
}) {
  // Check if database is available
  if (!process.env.DATABASE_URL) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation showNavigationMenu={true} currentPage='discover' />
        <PageContainer>
          <PageHeader
            title='Discover Franchises'
            description='Explore public franchise universes created by the community'
          />
          <div className='text-center py-8'>
            <p className='text-gray-600'>
              Database not available. Please check back later.
            </p>
          </div>
        </PageContainer>
      </div>
    )
  }

  let user = null
  let publicUniverses: Universe[] = []
  let userFavorites: string[] = []
  const universeOwners: Record<
    string,
    { id: string; name: string | null; email: string }
  > = {}

  const { q: searchQuery, sort } = await searchParams

  try {
    user = await getCurrentUser()
  } catch (error) {
    console.error('Error getting current user:', error)
  }

  try {
    // Fetch public universes with optional search
    publicUniverses = await universeService.getPublicUniverses({
      searchQuery,
      sortBy: sort as 'newest' | 'oldest' | 'name' | undefined,
    })
  } catch (error) {
    console.error('Error fetching public universes:', error)
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation showNavigationMenu={true} currentPage='discover' />
        <PageContainer>
          <PageHeader
            title='Discover Franchises'
            description='Explore public franchise universes created by the community'
          />
          <div className='text-center py-8'>
            <p className='text-gray-600'>
              Unable to load franchises. Please try again later.
            </p>
          </div>
        </PageContainer>
      </div>
    )
  }

  // Get user's favorites if authenticated
  if (user && user.id) {
    try {
      const favorites = await userService.getUserFavourites(user.id)
      userFavorites = favorites.universes
    } catch (error) {
      console.error('Error fetching user favorites:', error)
    }
  }

  // Fetch universe owners for display
  const uniqueUserIds = Array.from(new Set(publicUniverses.map(u => u.userId)))

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
