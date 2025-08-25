import { getCurrentUser } from '@/lib/auth-helpers'
import { universeService, userService } from '@/lib/services'
import { Navigation } from '@/components/layout/Navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { UniverseCard } from '@/components/content/UniverseCard'
import { FavoritesStats } from '@/components/content/FavoritesStats'
import { ButtonLink } from '@/components/interactive/Button'
import { AccountDeletionSuccess } from '@/components/AccountDeletionSuccess'
import { HiPlus } from 'react-icons/hi'

/**
 * Dashboard page showing user's universes with statistics and quick actions
 * Server component with server-side data fetching for performance
 */
export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50'>
        <Navigation showNavigationMenu={false} />
        <PageContainer>
          <AccountDeletionSuccess />
          <PageHeader
            title='Welcome to CanonCore'
            description='Sign in to start organizing your favorite franchises'
          />
          <div className='text-center py-12'>
            <p className='text-gray-600 mb-6'>
              CanonCore helps you organize and track your progress through your
              favorite fictional franchises.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <ButtonLink href='/api/auth/signin' variant='primary'>
                Sign In to Get Started
              </ButtonLink>
              <ButtonLink href='/register' variant='secondary'>
                Create Account
              </ButtonLink>
            </div>
          </div>
        </PageContainer>
      </div>
    )
  }

  // Fetch user's universes and statistics
  if (!user.id) {
    throw new Error('User ID is required')
  }

  const universes = await universeService.getByUserId(user.id)
  const favorites = await userService.getUserFavourites(user.id)

  // Calculate statistics
  const totalUniverses = universes.length
  const publicUniverses = universes.filter(u => u.isPublic).length
  const favoriteUniverses = favorites.universes.length

  return (
    <div className='min-h-screen bg-gray-50'>
      <Navigation showNavigationMenu={true} currentPage='dashboard' />

      <PageContainer>
        <PageHeader
          title='Dashboard'
          description='Manage your franchise universes and track your progress'
          actions={[
            {
              type: 'primary',
              label: 'Create Universe',
              href: '/universes/create',
            },
          ]}
        />

        {/* Statistics */}
        <div className='mb-8 grid grid-cols-1 md:grid-cols-3 gap-6'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='text-2xl font-bold text-gray-900'>
              {totalUniverses}
            </div>
            <div className='text-sm text-gray-600'>Total Universes</div>
          </div>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='text-2xl font-bold text-gray-900'>
              {publicUniverses}
            </div>
            <div className='text-sm text-gray-600'>Public Universes</div>
          </div>
          <FavoritesStats serverCount={favoriteUniverses} />
        </div>

        {/* User's Universes */}
        <div className='mb-8'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-semibold text-gray-900'>
              Your Universes
            </h2>
            <ButtonLink
              href='/universes/create'
              variant='primary'
              icon={<HiPlus className='h-4 w-4' />}
            >
              Create Universe
            </ButtonLink>
          </div>

          {universes.length === 0 ? (
            <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
              <div className='max-w-md mx-auto'>
                <h3 className='text-lg font-medium text-gray-900 mb-2'>
                  No universes yet
                </h3>
                <p className='text-gray-600 mb-6'>
                  Start organizing your favorite franchises by creating your
                  first universe.
                </p>
                <ButtonLink
                  href='/universes/create'
                  variant='primary'
                  icon={<HiPlus className='h-4 w-4' />}
                >
                  Create Your First Universe
                </ButtonLink>
              </div>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {universes.map(universe => (
                <UniverseCard
                  key={universe.id}
                  universe={universe}
                  href={`/universes/${universe.id}`}
                  showFavourite={true}
                  showOwnerBadge={true}
                  currentUserId={user.id}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className='bg-white rounded-lg shadow-sm p-6'>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>
            Quick Actions
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <ButtonLink
              href='/universes/create'
              variant='secondary'
              className='justify-start'
              icon={<HiPlus className='h-4 w-4' />}
            >
              Create New Universe
            </ButtonLink>
            <ButtonLink
              href='/discover'
              variant='secondary'
              className='justify-start'
            >
              Discover Public Universes
            </ButtonLink>
          </div>
        </div>
      </PageContainer>
    </div>
  )
}
