'use client'

import { useState } from 'react'
import Image from 'next/image'
import { User, Universe } from '@/lib/db/schema'
import { Button } from '@/components/interactive/Button'
import { PageLayout } from '@/components/layout/PageLayout'
import { PublicUniversesDisplay } from './PublicUniversesDisplay'
import { FavouritesDisplay } from './FavouritesDisplay'

interface ProfileDisplayProps {
  user: User
  canEdit: boolean
  publicUniverses: Universe[]
  favouritesCount: number
}

/**
 * Profile Display Component
 *
 * Shows user profile information with tabs for universes and favourites
 * Includes edit functionality for profile owners
 */
export function ProfileDisplay({
  user,
  canEdit,
  publicUniverses,
  favouritesCount,
}: ProfileDisplayProps) {
  const [activeTab, setActiveTab] = useState<'universes' | 'favourites'>(
    'universes'
  )

  const avatarElement = (
    <div className='h-16 w-16 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden'>
      {user.image ? (
        <Image
          src={user.image}
          alt={`${user.name || 'User'} avatar`}
          className='h-full w-full object-cover'
          width={64}
          height={64}
        />
      ) : (
        <div className='flex items-center justify-center h-full w-full bg-primary-100 text-primary-600'>
          <span className='text-xl font-semibold'>
            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )

  const profileDescription = (
    <p className='text-base text-neutral-600'>
      {user.email} • Member since{' '}
      <span suppressHydrationWarning>
        {user.createdAt
          ? new Date(user.createdAt).toLocaleDateString()
          : 'Unknown'}
      </span>
    </p>
  )

  return (
    <PageLayout
      currentPage='profile'
      header={{
        title: user.name || 'Anonymous User',
        description: profileDescription,
        icon: avatarElement,
        actions: canEdit
          ? [
              {
                type: 'primary',
                label: 'Edit Profile',
                href: `/profile/${user.id}/edit`,
              },
            ]
          : [],
      }}
    >
      {/* Tab Navigation */}
      <div className='mb-6'>
        <nav className='flex gap-2'>
          <Button
            onClick={() => setActiveTab('universes')}
            variant={activeTab === 'universes' ? 'primary' : 'secondary'}
            size='small'
          >
            Public Universes ({publicUniverses.length})
          </Button>
          <Button
            onClick={() => setActiveTab('favourites')}
            variant={activeTab === 'favourites' ? 'primary' : 'secondary'}
            size='small'
          >
            Favourites ({favouritesCount})
          </Button>
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'universes' && (
          <PublicUniversesDisplay
            publicUniverses={publicUniverses}
            user={user}
            canEdit={canEdit}
          />
        )}

        {activeTab === 'favourites' && (
          <FavouritesDisplay user={user} canEdit={canEdit} />
        )}
      </div>
    </PageLayout>
  )
}
