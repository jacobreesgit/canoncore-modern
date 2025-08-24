'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { UniverseCard } from '@/components/content/UniverseCard'
import { SearchBar, FilterBar, FilterOptions } from '@/components/interactive'
import { Button, ButtonLink } from '@/components/interactive/Button'
import { useSearch } from '@/lib/hooks/useSearch'
import type { Universe } from '@/lib/types'

interface UniverseWithFavorite extends Universe {
  isFavorite?: boolean
}

interface DiscoverClientProps {
  initialUniverses: UniverseWithFavorite[]
  universeOwners: Record<
    string,
    { id: string; name: string | null; email: string }
  >
  currentUserId?: string
}

/**
 * Client component for discover page with search and filtering
 */
export function DiscoverClient({
  initialUniverses,
  universeOwners,
  currentUserId,
}: DiscoverClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Initialize filters from URL
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: (searchParams.get('sort') as FilterOptions['sortBy']) || 'newest',
  })

  // Enhanced search with Fuse.js fuzzy matching
  const {
    searchQuery,
    setSearchQuery,
    filteredResults,
    searchResultsText,
    isSearching,
  } = useSearch(initialUniverses, {
    keys: ['name', 'description'],
    fuseOptions: {
      threshold: 0.3,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    },
    defaultMessage: 'Search public universes...',
  })

  // Apply additional sorting based on filters
  const displayUniverses = useMemo(() => {
    const sorted = [...filteredResults]

    switch (filters.sortBy) {
      case 'oldest':
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      case 'name':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'newest':
      default:
        return sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
    }
  }, [filteredResults, filters.sortBy])

  // Update URL when search or filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set('q', searchQuery)
    if (filters.sortBy !== 'newest') params.set('sort', filters.sortBy)

    const newUrl = params.toString() ? `?${params.toString()}` : '/discover'
    router.replace(newUrl)
  }, [searchQuery, filters.sortBy, router])

  // Initialize search query from URL
  useEffect(() => {
    const initialQuery = searchParams.get('q') || ''
    if (initialQuery !== searchQuery) {
      setSearchQuery(initialQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
  }

  return (
    <div className='space-y-6'>
      {/* Search */}
      <div className='bg-white rounded-lg shadow-sm p-6'>
        <SearchBar
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder='Search public universes...'
          variant='large'
          className='max-w-xl mx-auto'
        />

        {isSearching && (
          <div className='mt-4 text-center'>
            <p className='text-sm text-gray-600'>{searchResultsText}</p>
            {displayUniverses.length > 0 && (
              <Button
                variant='clear'
                onClick={() => setSearchQuery('')}
                className='mt-2 text-sm'
              >
                Clear search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      {displayUniverses.length > 0 && (
        <FilterBar
          currentFilters={filters}
          onFiltersChange={handleFiltersChange}
          resultsCount={displayUniverses.length}
        />
      )}

      {/* Results */}
      <div>
        {displayUniverses.length === 0 ? (
          <div className='bg-white rounded-lg shadow-sm p-12 text-center'>
            <div className='max-w-md mx-auto'>
              {isSearching ? (
                <>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No universes found
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Try adjusting your search terms or{' '}
                    <button
                      onClick={() => setSearchQuery('')}
                      className='text-blue-600 hover:text-blue-700 underline'
                    >
                      browse all universes
                    </button>
                  </p>
                </>
              ) : (
                <>
                  <h3 className='text-lg font-medium text-gray-900 mb-2'>
                    No public universes yet
                  </h3>
                  <p className='text-gray-600 mb-6'>
                    Be the first to create a public universe for others to
                    discover.
                  </p>
                  {currentUserId && (
                    <ButtonLink href='/universes/create' variant='primary'>
                      Create Universe
                    </ButtonLink>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-semibold text-gray-900'>
                {isSearching ? 'Search Results' : 'Public Universes'}
              </h2>
              <div className='text-sm text-gray-600'>
                {displayUniverses.length} universe
                {displayUniverses.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {displayUniverses.map(universe => {
                const owner = universeOwners[universe.userId]

                return (
                  <UniverseCard
                    key={universe.id}
                    universe={universe}
                    href={`/universes/${universe.id}`}
                    showFavourite={!!currentUserId}
                    showOwner={true}
                    ownerName={owner?.name || owner?.email || 'Unknown User'}
                    showOwnerBadge={false}
                    currentUserId={currentUserId}
                  />
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Call to action for authenticated users */}
      {currentUserId && displayUniverses.length > 0 && (
        <div className='bg-white rounded-lg shadow-sm p-6 text-center'>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>
            Create Your Own Universe
          </h3>
          <p className='text-gray-600 mb-4'>
            Share your favorite franchise with the community.
          </p>
          <ButtonLink href='/universes/create' variant='primary'>
            Create Universe
          </ButtonLink>
        </div>
      )}
    </div>
  )
}
