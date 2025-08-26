'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFavouritesStore } from '@/lib/stores/favourites-store'

/**
 * Store initialization provider
 * Loads initial state for favourites store when user is authenticated
 * Progress data is loaded per-page as needed for optimal performance
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const loadInitialFavourites = useFavouritesStore(
    state => state.loadInitialFavourites
  )

  useEffect(() => {
    // Only load initial data when user is authenticated
    if (status === 'authenticated' && session?.user) {
      // Load favourites (progress is loaded per-page for performance)
      loadInitialFavourites().catch(error => {
        if (process.env.NODE_ENV === 'development') {
          console.error('Failed to load initial favourites:', error)
        }
      })
    }
  }, [status, session?.user, loadInitialFavourites])

  return <>{children}</>
}
