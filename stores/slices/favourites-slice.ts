import { StateCreator } from 'zustand'
import {
  toggleFavouriteAction,
  getUserFavouritesAction,
} from '@/lib/actions/favourites-actions'

export interface FavouriteItem {
  targetId: string
  targetType: 'universe' | 'content'
  isFavorite: boolean
}

export interface FavouritesState {
  /** Map of targetId -> FavouriteItem for efficient lookups */
  favourites: Map<string, FavouriteItem>
  /** Set of targetIds currently being updated for loading states */
  loading: Set<string>
  /** Whether initial favourites have been loaded */
  isInitialized: boolean
}

export interface FavouritesActions {
  /** Toggle favourite status with optimistic updates */
  toggleFavourite: (
    targetId: string,
    targetType: 'universe' | 'content'
  ) => Promise<void>
  /** Set favourite status directly (for initial load) */
  setFavourite: (
    targetId: string,
    targetType: 'universe' | 'content',
    isFavorite: boolean
  ) => void
  /** Load initial favourites from server */
  loadInitialFavourites: (userId: string) => Promise<void>
  /** Check if item is favourite */
  isFavorite: (targetId: string) => boolean
  /** Check if item is currently loading */
  isLoading: (targetId: string) => boolean
  /** Reset store state */
  reset: () => void
}

export type FavouritesSlice = FavouritesState & FavouritesActions

export const createFavouritesSlice: StateCreator<
  FavouritesSlice,
  [],
  [],
  FavouritesSlice
> = (set, get) => ({
  // Initial state
  favourites: new Map(),
  loading: new Set(),
  isInitialized: false,

  // Actions
  toggleFavourite: async (
    targetId: string,
    targetType: 'universe' | 'content'
  ) => {
    const { favourites, loading } = get()

    // Prevent multiple simultaneous updates
    if (loading.has(targetId)) {
      return
    }

    const currentItem = favourites.get(targetId)
    const currentState = currentItem?.isFavorite || false
    const newState = !currentState

    // Optimistic update - immediately update UI
    set(state => ({
      favourites: new Map(state.favourites).set(targetId, {
        targetId,
        targetType,
        isFavorite: newState,
      }),
      loading: new Set(state.loading).add(targetId),
    }))

    try {
      // Call server action
      const result = await toggleFavouriteAction(targetId, targetType)

      if (result.success) {
        // Server confirmed - keep optimistic update
        set(state => ({
          loading: new Set([...state.loading].filter(id => id !== targetId)),
        }))
      } else {
        // Server rejected - rollback optimistic update
        set(state => ({
          favourites: new Map(state.favourites).set(targetId, {
            targetId,
            targetType,
            isFavorite: currentState,
          }),
          loading: new Set([...state.loading].filter(id => id !== targetId)),
        }))
        console.error('Error toggling favourite:', result.error)
      }
    } catch (error) {
      // Network error - rollback optimistic update
      set(state => ({
        favourites: new Map(state.favourites).set(targetId, {
          targetId,
          targetType,
          isFavorite: currentState,
        }),
        loading: new Set([...state.loading].filter(id => id !== targetId)),
      }))
      console.error('Error toggling favourite:', error)
    }
  },

  setFavourite: (
    targetId: string,
    targetType: 'universe' | 'content',
    isFavorite: boolean
  ) => {
    set(state => ({
      favourites: new Map(state.favourites).set(targetId, {
        targetId,
        targetType,
        isFavorite,
      }),
    }))
  },

  loadInitialFavourites: async () => {
    try {
      const result = await getUserFavouritesAction()

      if (result.success && result.data) {
        const newFavourites = new Map<string, FavouriteItem>()

        // Add universe favourites
        result.data.universes.forEach(targetId => {
          newFavourites.set(targetId, {
            targetId,
            targetType: 'universe',
            isFavorite: true,
          })
        })

        // Add content favourites
        result.data.content.forEach(targetId => {
          newFavourites.set(targetId, {
            targetId,
            targetType: 'content',
            isFavorite: true,
          })
        })

        set({
          favourites: newFavourites,
          isInitialized: true,
        })
      } else {
        console.error('Failed to load favourites:', result.error)
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('Error loading favourites:', error)
      set({ isInitialized: true })
    }
  },

  isFavorite: (targetId: string) => {
    const { favourites } = get()
    return favourites.get(targetId)?.isFavorite || false
  },

  isLoading: (targetId: string) => {
    const { loading } = get()
    return loading.has(targetId)
  },

  reset: () => {
    set({
      favourites: new Map(),
      loading: new Set(),
      isInitialized: false,
    })
  },
})
