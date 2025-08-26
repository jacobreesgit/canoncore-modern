'use client'

import { User, Universe } from '@/lib/db/schema'
import { UniverseCard } from '@/components/content/UniverseCard'
import { ContentDisplay } from '@/components/content/ContentDisplay'

interface PublicUniversesDisplayProps {
  publicUniverses: Universe[]
  user: User
  canEdit: boolean
}

/**
 * PublicUniversesDisplay Component
 *
 * Displays a user's public universes with search and filtering functionality
 * Uses ContentDisplay for consistent UI patterns
 */
export function PublicUniversesDisplay({
  publicUniverses,
  user,
  canEdit,
}: PublicUniversesDisplayProps) {
  // Sort universes function
  const sortUniverses = (universes: Universe[], sortBy: string): Universe[] => {
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
    <ContentDisplay
      items={publicUniverses}
      displayMode='grid'
      searchPlaceholder='Search public universes...'
      filterItems={sortUniverses}
      getSearchText={(universe: Universe) =>
        `${universe.name} ${universe.description || ''}`
      }
      renderItem={(universe: Universe) => (
        <UniverseCard
          universe={universe}
          href={`/universes/${universe.id}`}
          showFavourite={true}
          showOwnerBadge={false}
          currentUserId={user.id}
        />
      )}
      emptyStateTitle={
        canEdit ? 'No public universes yet' : 'No public universes'
      }
      emptyStateDescription={
        canEdit
          ? 'Create your first public universe to share with the community.'
          : "This user hasn't shared any universes publicly yet."
      }
      gridClasses='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
    />
  )
}
