'use client'

import React from 'react'
import { useFavouritesStore } from '@/stores/favourites-store'

interface FavoritesStatsProps {
  serverCount: number
}

/**
 * Client-side favorites count that syncs with Zustand store
 * Uses hydration status to prevent hydration mismatch
 */
export function FavoritesStats({ serverCount }: FavoritesStatsProps) {
  const hasHydrated = useFavouritesStore(state => state._hasHydrated)
  const getFavouritesCount = useFavouritesStore(
    state => state.getFavouritesCount
  )

  // Use server count until hydrated to prevent hydration mismatch
  const count = hasHydrated ? getFavouritesCount() : serverCount

  return (
    <div className='bg-white rounded-lg shadow-sm p-6'>
      <div className='text-2xl font-bold text-gray-900'>{count}</div>
      <div className='text-sm text-gray-600'>Favorite Universes</div>
    </div>
  )
}
