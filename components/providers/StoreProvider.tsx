'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useFavouritesStore } from '@/stores/favourites-store'
import { useProgressStore } from '@/stores/progress-store'

/**
 * Store initialization provider
 * Loads initial state for all stores when user is authenticated
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const loadInitialFavourites = useFavouritesStore(
    state => state.loadInitialFavourites
  )
  const loadInitialProgress = useProgressStore(
    state => state.loadInitialProgress
  )

  useEffect(() => {
    // Only load initial data when user is authenticated
    if (status === 'authenticated' && session?.user) {
      // Load favourites and progress in parallel
      Promise.all([loadInitialFavourites(), loadInitialProgress()]).catch(
        error => {
          console.error('Failed to load initial store data:', error)
        }
      )
    }
  }, [status, session?.user, loadInitialFavourites, loadInitialProgress])

  return <>{children}</>
}
