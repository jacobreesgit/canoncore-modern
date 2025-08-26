'use client'

import { UniverseCard } from '@/components/content/UniverseCard'
import { ContentDisplay } from '@/components/content/ContentDisplay'
import { ButtonLink } from '@/components/interactive/Button'
import { PageLayout } from '@/components/layout/PageLayout'
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
  // Sort universes function
  const sortUniverses = (
    universes: UniverseWithFavorite[],
    sortBy: string
  ): UniverseWithFavorite[] => {
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

  return (
    <PageLayout
      currentPage='discover'
      header={{
        title: 'Discover Franchises',
        description:
          'Explore public franchise universes created by the community',
      }}
    >
      <ContentDisplay
        items={initialUniverses}
        displayMode='grid'
        title='Public Universes'
        searchPlaceholder='Search public universes...'
        filterItems={sortUniverses}
        getSearchText={(universe: UniverseWithFavorite) =>
          `${universe.name} ${universe.description || ''}`
        }
        renderItem={(universe: UniverseWithFavorite) => {
          const owner = universeOwners[universe.userId]
          return (
            <UniverseCard
              universe={universe}
              href={`/universes/${universe.id}`}
              showFavourite={!!currentUserId}
              showOwner={true}
              ownerName={owner?.name || owner?.email || 'Unknown User'}
              showOwnerBadge={false}
              currentUserId={currentUserId}
            />
          )
        }}
        emptyStateTitle='No public universes yet'
        emptyStateDescription='Be the first to create a public universe for others to discover.'
        button={
          currentUserId ? (
            <ButtonLink href='/universes/create' variant='primary'>
              Create Universe
            </ButtonLink>
          ) : undefined
        }
      />
    </PageLayout>
  )
}
