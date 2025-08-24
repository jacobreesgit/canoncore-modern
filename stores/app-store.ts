import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import {
  createFavouritesSlice,
  type FavouritesSlice,
} from './slices/favourites-slice'
import {
  createProgressSlice,
  type ProgressSlice,
} from './slices/progress-slice'

// Combined store type using slices pattern
export type AppStore = FavouritesSlice & ProgressSlice

// Create the main app store combining all slices
export const useAppStore = create<AppStore>()(
  devtools(
    (...a) => ({
      ...createFavouritesSlice(...a),
      ...createProgressSlice(...a),
    }),
    {
      name: 'canoncore-app-store',
      // Enable devtools actions for debugging
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

// Convenience selectors for common use cases
export const useFavourites = () =>
  useAppStore(state => ({
    favourites: state.favourites,
    toggleFavourite: state.toggleFavourite,
    isFavorite: state.isFavorite,
    isLoading: state.isLoading,
  }))

export const useProgress = () =>
  useAppStore(state => ({
    progress: state.progress,
    setProgress: state.setProgress,
    getProgress: state.getProgress,
    calculateAndCacheProgress: state.calculateAndCacheProgress,
    isLoading: state.isLoading,
  }))

// Individual action selectors for external use (non-hook context)
export const getFavouriteActions = () => ({
  toggleFavourite: useAppStore.getState().toggleFavourite,
  setFavourite: useAppStore.getState().setFavourite,
  loadInitialFavourites: useAppStore.getState().loadInitialFavourites,
  isFavorite: useAppStore.getState().isFavorite,
  reset: useAppStore.getState().reset,
})

export const getProgressActions = () => ({
  setProgress: useAppStore.getState().setProgress,
  setProgressLocal: useAppStore.getState().setProgressLocal,
  getProgress: useAppStore.getState().getProgress,
  calculateAndCacheProgress: useAppStore.getState().calculateAndCacheProgress,
  loadInitialProgress: useAppStore.getState().loadInitialProgress,
  reset: useAppStore.getState().reset,
})

// Store initialization helper
export const initializeAppStore = async (userId: string) => {
  const state = useAppStore.getState()

  // Load initial data in parallel
  await Promise.all([
    state.loadInitialFavourites(userId),
    state.loadInitialProgress(userId),
  ])
}

// Store reset helper (useful for auth logout)
export const resetAppStore = () => {
  const state = useAppStore.getState()
  state.reset() // This will reset both slices since they share the same reset method name
}
