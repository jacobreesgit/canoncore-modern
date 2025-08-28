'use client'

import { Universe } from '@/lib/db/schema'
import { PageLayout } from '@/components/layout/PageLayout'
import { UniverseCard } from '@/components/content/UniverseCard'
import { ContentGrid } from '@/components/content/ContentGrid'
import { ButtonLink } from '@/components/interactive/Button'

interface DashboardClientProps {
  user: {
    id: string
    name: string | null | undefined
    email: string | null | undefined
    image: string | null | undefined
  }
  universes: Universe[]
}

export function DashboardClient({ user, universes }: DashboardClientProps) {
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
    <PageLayout
      currentPage='dashboard'
      header={{
        title: 'Dashboard',
        description: 'Manage your franchise universes and track your progress',
      }}
    >
      <ContentGrid
        items={universes}
        title='Your Universes'
        searchPlaceholder='Search your universes...'
        filterItems={sortUniverses}
        getSearchText={(universe: Universe) =>
          `${universe.name} ${universe.description || ''}`
        }
        renderItem={(universe: Universe) => (
          <UniverseCard
            universe={universe}
            href={`/universes/${universe.id}`}
            showFavourite={true}
            showOwnerBadge={true}
            currentUserId={user.id}
          />
        )}
        emptyStateTitle='No universes yet'
        emptyStateDescription="Start organizing your favorite franchises by creating your first universe using the 'Create Universe' button above."
        button={
          <ButtonLink href='/universes/create' variant='primary'>
            Create Universe
          </ButtonLink>
        }
      />
    </PageLayout>
  )
}
