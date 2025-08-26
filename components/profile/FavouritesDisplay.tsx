'use client'

import { useState, useEffect } from 'react'
import { User, Universe, Content } from '@/lib/db/schema'
import { useFavouritesStore } from '@/lib/stores/favourites-store'
import {
  getFavoriteUniversesAction,
  getFavoriteContentAction,
} from '@/lib/actions/favourites-actions'
import { UniverseCard } from '@/components/content/UniverseCard'
import { Button } from '@/components/interactive/Button'
import { ContentDisplay } from '@/components/content/ContentDisplay'

interface FavouritesDisplayProps {
  user: User
  canEdit: boolean
}

interface FavoriteUniverse extends Universe {
  isFavorite: boolean
}

interface FavoriteContent extends Content {
  isFavorite: boolean
  universeName?: string
}

/**
 * FavouritesDisplay Component
 *
 * Displays user's favourites organized by type (universes and content)
 * with real-time updates from the favourites store
 * Uses ContentDisplay for consistent UI patterns
 */
export function FavouritesDisplay({ user, canEdit }: FavouritesDisplayProps) {
  const [favouritesActiveTab, setFavouritesActiveTab] = useState<
    'universes' | 'content'
  >('universes')
  const [favoriteUniverses, setFavoriteUniverses] = useState<
    FavoriteUniverse[]
  >([])
  const [favoriteContent, setFavoriteContent] = useState<FavoriteContent[]>([])
  const [favoritesLoading, setFavoritesLoading] = useState(true)

  // Get favorite counts to trigger re-fetch when favorites change
  const universeCount = useFavouritesStore(state => state.universes.size)
  const contentCount = useFavouritesStore(state => state.content.size)

  // Load favorites when component mounts or favorites change
  useEffect(() => {
    const loadFavorites = async () => {
      setFavoritesLoading(true)

      try {
        const [universesResult, contentResult] = await Promise.all([
          getFavoriteUniversesAction(),
          getFavoriteContentAction(),
        ])

        if (universesResult.success && universesResult.data) {
          setFavoriteUniverses(universesResult.data)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              'Error loading favorite universes:',
              universesResult.error
            )
          }
          setFavoriteUniverses([])
        }

        if (contentResult.success && contentResult.data) {
          setFavoriteContent(contentResult.data)
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error(
              'Error loading favorite content:',
              contentResult.error
            )
          }
          setFavoriteContent([])
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('Error loading favorites:', error)
        }
        setFavoriteUniverses([])
        setFavoriteContent([])
      } finally {
        setFavoritesLoading(false)
      }
    }

    loadFavorites()
  }, [universeCount, contentCount])

  // Sort universes function
  const sortUniverses = (
    universes: FavoriteUniverse[],
    sortBy: string
  ): FavoriteUniverse[] => {
    const sorted = [...universes]
    switch (sortBy) {
      case 'oldest':
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        )
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'newest':
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        )
    }
  }

  if (favoritesLoading) {
    return (
      <div className='flex justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
      </div>
    )
  }

  const totalFavorites = favoriteUniverses.length + favoriteContent.length

  return (
    <div className='space-y-6'>
      {totalFavorites > 0 && (
        <>
          {/* Favourites Tab Navigation */}
          <div className='border-b border-neutral-200'>
            <nav className='flex space-x-8'>
              <Button
                onClick={() => setFavouritesActiveTab('universes')}
                variant='clear'
                className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                  favouritesActiveTab === 'universes'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                }`}
              >
                Universe Favourites ({favoriteUniverses.length})
              </Button>
              <Button
                onClick={() => setFavouritesActiveTab('content')}
                variant='clear'
                className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
                  favouritesActiveTab === 'content'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
                }`}
              >
                Content Favourites ({favoriteContent.length})
              </Button>
            </nav>
          </div>
        </>
      )}

      {/* Overall Empty State */}
      {totalFavorites === 0 && (
        <ContentDisplay
          items={[]}
          displayMode='grid'
          renderItem={() => <div />}
          emptyState={
            <div className='text-center py-8'>
              <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                No favourites yet
              </h3>
              <p className='text-neutral-600 mb-6'>
                {canEdit
                  ? "You haven't favourited anything yet."
                  : "This user hasn't favourited anything yet."}
              </p>
              {canEdit && (
                <Button
                  variant='primary'
                  onClick={() => (window.location.href = '/discover')}
                >
                  Discover Universes
                </Button>
              )}
            </div>
          }
        />
      )}

      {/* Favourites Content */}
      {totalFavorites > 0 && favouritesActiveTab === 'universes' && (
        <ContentDisplay
          items={favoriteUniverses}
          displayMode='grid'
          searchable={true}
          searchPlaceholder='Search favourite universes...'
          filterItems={sortUniverses}
          getSearchText={universe =>
            `${universe.name} ${universe.description || ''}`
          }
          renderItem={universe => (
            <UniverseCard
              universe={universe}
              href={`/universes/${universe.id}`}
              showFavourite={true}
              showOwner={universe.userId !== user.id}
              currentUserId={user.id}
            />
          )}
          emptyState={
            <div className='text-center py-8'>
              <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                No favourite universes yet
              </h3>
              <p className='text-neutral-600 mb-6'>
                {canEdit
                  ? 'Discover universes to add to your favourites.'
                  : 'This user has no favourite universes.'}
              </p>
              {canEdit && (
                <Button
                  variant='primary'
                  onClick={() => (window.location.href = '/discover')}
                >
                  Discover Universes
                </Button>
              )}
            </div>
          }
          gridClasses='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
        />
      )}

      {totalFavorites > 0 && favouritesActiveTab === 'content' && (
        <ContentDisplay
          items={favoriteContent}
          displayMode='list'
          searchable={true}
          searchPlaceholder='Search favourite content...'
          getSearchText={content =>
            `${content.name} ${content.description || ''} ${(content as FavoriteContent).universeName || ''}`
          }
          renderItem={content => {
            const favoriteContent = content as FavoriteContent
            return (
              <div className='bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <h3 className='text-lg font-medium text-neutral-900 mb-1'>
                      <a
                        href={`/content/${favoriteContent.id}`}
                        className='hover:text-primary-600 transition-colors'
                      >
                        {favoriteContent.name}
                      </a>
                    </h3>
                    <p className='text-sm text-neutral-600 mb-2'>
                      in{' '}
                      <a
                        href={`/universes/${favoriteContent.universeId}`}
                        className='text-primary-600 hover:text-primary-700'
                      >
                        {favoriteContent.universeName}
                      </a>
                    </p>
                    {favoriteContent.description && (
                      <p className='text-sm text-neutral-500 line-clamp-2'>
                        {favoriteContent.description}
                      </p>
                    )}
                  </div>
                  <div className='ml-4 flex-shrink-0'>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        favoriteContent.isViewable
                          ? 'bg-success-100 text-success-800'
                          : 'bg-primary-100 text-primary-800'
                      }`}
                    >
                      {favoriteContent.isViewable
                        ? 'Viewable'
                        : 'Organisational'}
                    </span>
                  </div>
                </div>
              </div>
            )
          }}
          emptyState={
            <div className='text-center py-8'>
              <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                No favourite content yet
              </h3>
              <p className='text-neutral-600 mb-6'>
                {canEdit
                  ? 'Favourite individual content items while browsing universes.'
                  : 'This user has no favourite content.'}
              </p>
              {canEdit && (
                <Button
                  variant='primary'
                  onClick={() => (window.location.href = '/discover')}
                >
                  Discover Universes
                </Button>
              )}
            </div>
          }
        />
      )}
    </div>
  )
}
