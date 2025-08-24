'use client'

import { useState, useEffect } from 'react'
import { UniverseCard } from '@/components/content/UniverseCard'
import { useFavouritesStore } from '@/stores/favourites-store'
import {
  getFavoriteUniversesAction,
  getFavoriteContentAction,
} from '@/lib/actions/favourites-actions'
import type { Universe, Content } from '@/lib/types'

interface FavouritesDisplayProps {
  userId: string
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
 * Displays user's favourites organized by type (universes and content)
 * with real-time updates from the favourites store
 */
export function FavouritesDisplay({ userId, canEdit }: FavouritesDisplayProps) {
  const [activeTab, setActiveTab] = useState<'universes' | 'content'>(
    'universes'
  )
  const [favoriteUniverses, setFavoriteUniverses] = useState<
    FavoriteUniverse[]
  >([])
  const [favoriteContent, setFavoriteContent] = useState<FavoriteContent[]>([])
  const [loading, setLoading] = useState(true)

  const universeIds = useFavouritesStore(state => Array.from(state.universes))
  const contentIds = useFavouritesStore(state => Array.from(state.content))

  useEffect(() => {
    const loadFavorites = async () => {
      setLoading(true)

      try {
        const [universesResult, contentResult] = await Promise.all([
          getFavoriteUniversesAction(),
          getFavoriteContentAction(),
        ])

        if (universesResult.success && universesResult.data) {
          setFavoriteUniverses(universesResult.data)
        } else {
          console.error(
            'Error loading favorite universes:',
            universesResult.error
          )
          setFavoriteUniverses([])
        }

        if (contentResult.success && contentResult.data) {
          setFavoriteContent(contentResult.data)
        } else {
          console.error('Error loading favorite content:', contentResult.error)
          setFavoriteContent([])
        }
      } catch (error) {
        console.error('Error loading favorites:', error)
        setFavoriteUniverses([])
        setFavoriteContent([])
      } finally {
        setLoading(false)
      }
    }

    loadFavorites()
  }, [universeIds, contentIds])

  if (loading) {
    return (
      <div className='flex justify-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  const totalFavorites = favoriteUniverses.length + favoriteContent.length

  if (totalFavorites === 0) {
    return (
      <div className='py-8 text-center'>
        <p className='text-gray-500 mb-4'>
          {canEdit
            ? "You haven't favourited anything yet."
            : "This user hasn't favourited anything yet."}
        </p>
        {canEdit && (
          <div className='space-x-4'>
            <a
              href='/discover'
              className='inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
            >
              Discover Universes
            </a>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Tab Navigation */}
      <div className='border-b border-gray-200'>
        <nav className='flex space-x-8'>
          <button
            onClick={() => setActiveTab('universes')}
            className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
              activeTab === 'universes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Universe Favourites ({favoriteUniverses.length})
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`border-b-2 pb-2 text-sm font-medium transition-colors ${
              activeTab === 'content'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Content Favourites ({favoriteContent.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'universes' && (
        <div>
          {favoriteUniverses.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-gray-500 mb-4'>No favourite universes yet.</p>
              {canEdit && (
                <a
                  href='/discover'
                  className='inline-block rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700'
                >
                  Discover Universes
                </a>
              )}
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {favoriteUniverses.map(universe => (
                <UniverseCard
                  key={universe.id}
                  universe={universe}
                  href={`/universes/${universe.id}`}
                  showFavourite={true}
                  showOwner={universe.userId !== userId}
                  currentUserId={userId}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'content' && (
        <div>
          {favoriteContent.length === 0 ? (
            <div className='py-8 text-center'>
              <p className='text-gray-500 mb-4'>No favourite content yet.</p>
              {canEdit && (
                <p className='text-sm text-gray-400'>
                  Favourite individual content items while browsing universes.
                </p>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {favoriteContent.map(content => (
                <div
                  key={content.id}
                  className='bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                >
                  <div className='flex justify-between items-start'>
                    <div className='flex-1'>
                      <h3 className='font-medium text-gray-900 mb-1'>
                        <a
                          href={`/content/${content.id}`}
                          className='hover:text-blue-600 transition-colors'
                        >
                          {content.name}
                        </a>
                      </h3>
                      <p className='text-sm text-gray-600 mb-2'>
                        in{' '}
                        <a
                          href={`/universes/${content.universeId}`}
                          className='text-blue-600 hover:text-blue-700'
                        >
                          {content.universeName}
                        </a>
                      </p>
                      {content.description && (
                        <p className='text-sm text-gray-500 line-clamp-2'>
                          {content.description}
                        </p>
                      )}
                    </div>
                    <div className='ml-4 flex-shrink-0'>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          content.isViewable
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {content.isViewable ? 'Viewable' : 'Organisational'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
