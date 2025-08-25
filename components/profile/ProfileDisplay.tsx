'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { User, Universe } from '@/lib/db/schema'
import { useFavouritesStore } from '@/stores/favourites-store'
import { FavouritesDisplay } from './FavouritesDisplay'
import { UniverseCard } from '@/components/content/UniverseCard'

interface ProfileStats {
  totalUniverses: number
  publicUniverses: number
}

interface ProfileDisplayProps {
  user: User
  stats: ProfileStats
  canEdit: boolean
  publicUniverses: Universe[]
}

/**
 * Profile Display Component
 *
 * Shows user profile information with tabs for universes and favourites
 * Includes edit functionality for profile owners
 */
export function ProfileDisplay({
  user,
  stats,
  canEdit,
  publicUniverses,
}: ProfileDisplayProps) {
  const [activeTab, setActiveTab] = useState<'universes' | 'favourites'>(
    'universes'
  )
  const favouritesCount = useFavouritesStore(state =>
    state.getFavouritesCount()
  )

  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-4xl px-4 py-8'>
        {/* Profile Header */}
        <div className='mb-8 rounded-lg bg-white p-6 shadow-sm'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-4'>
              <div className='h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden'>
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={`${user.name || 'User'} avatar`}
                    className='h-full w-full object-cover'
                    width={64}
                    height={64}
                  />
                ) : (
                  <div className='flex items-center justify-center h-full w-full bg-blue-100 text-blue-600'>
                    <span className='text-xl font-semibold'>
                      {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className='text-2xl font-bold text-gray-900'>
                  {user.name || 'Anonymous User'}
                </h1>
                <p className='text-gray-600'>{user.email}</p>
                <p className='text-sm text-gray-500'>
                  Member since{' '}
                  <span suppressHydrationWarning>
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </p>
              </div>
            </div>

            {canEdit && (
              <Link
                href={`/profile/${user.id}/edit`}
                className='rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
              >
                Edit Profile
              </Link>
            )}
          </div>

          {/* Stats */}
          <div className='mt-6 grid grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {stats.totalUniverses}
              </div>
              <div className='text-sm text-gray-600'>Total Universes</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {stats.publicUniverses}
              </div>
              <div className='text-sm text-gray-600'>Public Universes</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-900'>
                {favouritesCount}
              </div>
              <div className='text-sm text-gray-600'>Favourites</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className='mb-6'>
          <nav className='flex space-x-8'>
            <button
              onClick={() => setActiveTab('universes')}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'universes'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Public Universes ({stats.publicUniverses})
            </button>
            <button
              onClick={() => setActiveTab('favourites')}
              className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                activeTab === 'favourites'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              Favourites ({favouritesCount})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className='rounded-lg bg-white p-6 shadow-sm'>
          {activeTab === 'universes' && (
            <div>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                Public Universes
              </h2>
              {stats.publicUniverses === 0 ? (
                <div className='py-8 text-center'>
                  <p className='text-gray-500'>
                    {canEdit
                      ? "You haven't created any public universes yet."
                      : "This user hasn't created any public universes yet."}
                  </p>
                  {canEdit && (
                    <Link
                      href='/universes/create'
                      className='mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                    >
                      Create Your First Universe
                    </Link>
                  )}
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                  {publicUniverses.map(universe => (
                    <UniverseCard
                      key={universe.id}
                      universe={universe}
                      href={`/universes/${universe.id}`}
                      showFavourite={true}
                      showOwnerBadge={false}
                      currentUserId={user.id}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favourites' && (
            <div>
              <h2 className='mb-4 text-lg font-semibold text-gray-900'>
                Favourites
              </h2>
              {favouritesCount === 0 ? (
                <div className='py-8 text-center'>
                  <p className='text-gray-500'>
                    {canEdit
                      ? "You haven't favourited anything yet."
                      : "This user hasn't favourited anything yet."}
                  </p>
                  {canEdit && (
                    <Link
                      href='/discover'
                      className='mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                    >
                      Discover Universes
                    </Link>
                  )}
                </div>
              ) : (
                <FavouritesDisplay userId={user.id} canEdit={canEdit} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
