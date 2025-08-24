import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import {
  toggleFavouriteAction,
  getUserFavouritesAction,
} from '@/lib/actions/favourites-actions'

// Favourites store for universe and content favourites
// Replaces the custom event system from original FavouriteButtonClient
interface FavouritesState {
  // State
  universes: Set<string>
  content: Set<string>
  isLoading: boolean
  _hasHydrated: boolean

  // Actions
  isFavourite: (targetId: string, targetType: 'universe' | 'content') => boolean
  getFavouritesCount: () => number
  toggleFavourite: (
    targetId: string,
    targetType: 'universe' | 'content'
  ) => Promise<void>
  addFavourite: (targetId: string, targetType: 'universe' | 'content') => void
  removeFavourite: (
    targetId: string,
    targetType: 'universe' | 'content'
  ) => void
  setInitialFavourites: (universes: string[], content: string[]) => void
  loadInitialFavourites: () => Promise<void>
  clearAllFavourites: () => void
  setHasHydrated: (state: boolean) => void
}

// Custom storage to handle Set serialization/deserialization
const favouritesStorage = createJSONStorage(() => localStorage, {
  reviver: (key, value) => {
    // Convert arrays back to Sets during rehydration
    if ((key === 'universes' || key === 'content') && Array.isArray(value)) {
      return new Set(value)
    }
    return value
  },
  replacer: (key, value) => {
    // Convert Sets to arrays for storage
    if (value instanceof Set) {
      return Array.from(value)
    }
    return value
  },
})

export const useFavouritesStore = create<FavouritesState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        universes: new Set(),
        content: new Set(),
        isLoading: false,
        _hasHydrated: false,

        // Actions
        isFavourite: (targetId, targetType) => {
          const state = get()
          const favouriteSet =
            targetType === 'universe' ? state.universes : state.content
          return favouriteSet.has(targetId)
        },

        getFavouritesCount: () => {
          const state = get()
          return state.universes.size + state.content.size
        },

        toggleFavourite: async (targetId, targetType) => {
          // Optimistic update
          const currentState = get()
          const currentSet =
            targetType === 'universe'
              ? currentState.universes
              : currentState.content
          const wasAlreadyFavourite = currentSet.has(targetId)

          set(
            state => {
              const newSet = new Set(currentSet)

              if (wasAlreadyFavourite) {
                newSet.delete(targetId)
              } else {
                newSet.add(targetId)
              }

              return {
                ...state,
                isLoading: true,
                [targetType === 'universe' ? 'universes' : 'content']: newSet,
              }
            },
            false,
            `favourites/toggle-${targetType}-optimistic`
          )

          try {
            // Call server action
            const result = await toggleFavouriteAction(targetId, targetType)

            if (!result.success) {
              // Rollback optimistic update on error
              set(
                state => {
                  const rollbackSet = new Set(
                    targetType === 'universe' ? state.universes : state.content
                  )

                  if (wasAlreadyFavourite) {
                    rollbackSet.add(targetId) // Re-add if it was removed optimistically
                  } else {
                    rollbackSet.delete(targetId) // Remove if it was added optimistically
                  }

                  return {
                    ...state,
                    isLoading: false,
                    [targetType === 'universe' ? 'universes' : 'content']:
                      rollbackSet,
                  }
                },
                false,
                `favourites/toggle-${targetType}-rollback`
              )

              console.error('Failed to toggle favourite:', result.error)
              return
            }

            // Success - optimistic update was correct
            set(
              state => ({ ...state, isLoading: false }),
              false,
              `favourites/toggle-${targetType}-success`
            )
          } catch (error) {
            // Network error - rollback optimistic update
            set(
              state => {
                const rollbackSet = new Set(
                  targetType === 'universe' ? state.universes : state.content
                )

                if (wasAlreadyFavourite) {
                  rollbackSet.add(targetId)
                } else {
                  rollbackSet.delete(targetId)
                }

                return {
                  ...state,
                  isLoading: false,
                  [targetType === 'universe' ? 'universes' : 'content']:
                    rollbackSet,
                }
              },
              false,
              `favourites/toggle-${targetType}-error`
            )

            console.error('Network error toggling favourite:', error)
          }
        },

        addFavourite: (targetId, targetType) =>
          set(
            state => {
              const currentSet =
                targetType === 'universe' ? state.universes : state.content
              const newSet = new Set(currentSet)
              newSet.add(targetId)

              return targetType === 'universe'
                ? { ...state, universes: newSet }
                : { ...state, content: newSet }
            },
            false,
            `favourites/add-${targetType}`
          ),

        removeFavourite: (targetId, targetType) =>
          set(
            state => {
              const currentSet =
                targetType === 'universe' ? state.universes : state.content
              const newSet = new Set(currentSet)
              newSet.delete(targetId)

              return targetType === 'universe'
                ? { ...state, universes: newSet }
                : { ...state, content: newSet }
            },
            false,
            `favourites/remove-${targetType}`
          ),

        setInitialFavourites: (universes, content) =>
          set(
            {
              universes: new Set(universes),
              content: new Set(content),
            },
            false,
            'favourites/setInitial'
          ),

        loadInitialFavourites: async () => {
          set(
            state => ({ ...state, isLoading: true }),
            false,
            'favourites/loadStart'
          )

          try {
            const result = await getUserFavouritesAction()

            if (result.success && result.data) {
              set(
                {
                  universes: new Set(result.data.universes),
                  content: new Set(result.data.content),
                  isLoading: false,
                },
                false,
                'favourites/loadSuccess'
              )
            } else {
              console.error('Failed to load favourites:', result.error)
              set(
                state => ({ ...state, isLoading: false }),
                false,
                'favourites/loadError'
              )
            }
          } catch (error) {
            console.error('Network error loading favourites:', error)
            set(
              state => ({ ...state, isLoading: false }),
              false,
              'favourites/loadNetworkError'
            )
          }
        },

        clearAllFavourites: () =>
          set(
            {
              universes: new Set(),
              content: new Set(),
            },
            false,
            'favourites/clearAll'
          ),

        setHasHydrated: (hasHydrated: boolean) =>
          set(
            { _hasHydrated: hasHydrated },
            false,
            'favourites/setHasHydrated'
          ),
      }),
      {
        name: 'canoncore-favourites',
        storage: favouritesStorage,
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.error('Favourites store rehydration failed:', error)
            } else {
              state?.setHasHydrated(true)
            }
          }
        },
        // Persist the entire state since it's all user preferences
      }
    ),
    {
      name: 'Favourites Store',
    }
  )
)
