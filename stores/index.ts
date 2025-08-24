// Zustand stores for CanonCore
// Modern state management replacing React Context patterns

// Main app store (combines all slices)
export {
  useAppStore,
  useFavourites,
  useProgress,
  getFavouriteActions,
  getProgressActions,
  initializeAppStore,
  resetAppStore,
} from './app-store'

// Individual slices (for advanced usage)
export { createFavouritesSlice } from './slices/favourites-slice'
export { createProgressSlice } from './slices/progress-slice'

// Store types
export type { AppStore } from './app-store'
export type {
  FavouritesSlice,
  FavouritesState,
  FavouritesActions,
  FavouriteItem,
} from './slices/favourites-slice'
export type {
  ProgressSlice,
  ProgressState,
  ProgressActions,
} from './slices/progress-slice'
