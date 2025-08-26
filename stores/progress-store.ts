import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type {} from '@redux-devtools/extension' // required for devtools typing
import {
  setContentProgressAction,
  getAllUserProgressAction,
  getUserProgressByUniverseAction,
} from '@/lib/actions/progress-actions'
import {
  calculateUniverseProgressWithHierarchy,
  calculateContentProgressWithHierarchy,
  type HierarchyNode,
  type ProgressCalculation,
} from '@/lib/utils/progress'
import type { Content } from '@/lib/db/schema'

// Progress store for content progress tracking
// Replaces the progress Map from original app-state-context.tsx
interface ProgressState {
  // State - Map<contentId, progress percentage>
  progress: Map<string, number>
  isLoading: boolean

  // Actions
  getProgress: (contentId: string) => number
  getContentProgressWithHierarchy: (
    contentId: string,
    hierarchyTree: HierarchyNode[],
    contentItems: Content[]
  ) => number
  getUniverseProgress: (
    hierarchyTree: HierarchyNode[],
    contentItems: Content[]
  ) => ProgressCalculation
  setProgress: (
    contentId: string,
    universeId: string,
    progress: number
  ) => Promise<void>
  setInitialProgress: (progressMap: Record<string, number>) => void
  loadInitialProgress: () => Promise<void>
  loadUniverseProgress: (universeId: string) => Promise<void>
  clearProgress: (contentId: string) => void
  clearAllProgress: () => void

  // Utility actions
  hasProgress: (contentId: string) => boolean
  getProgressCount: () => number
  getCompletedCount: () => number // progress >= 100
}

// Custom storage to handle Map serialization/deserialization
const progressStorage = createJSONStorage(() => localStorage, {
  reviver: (key, value) => {
    // Convert object back to Map during rehydration
    if (
      key === 'progress' &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      return new Map(Object.entries(value))
    }
    return value
  },
  replacer: (key, value) => {
    // Convert Map to object for storage
    if (value instanceof Map) {
      return Object.fromEntries(value)
    }
    return value
  },
})

export const useProgressStore = create<ProgressState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        progress: new Map(),
        isLoading: false,

        // Actions
        getProgress: contentId => {
          const state = get()
          return state.progress.get(contentId) || 0
        },

        getContentProgressWithHierarchy: (
          contentId,
          hierarchyTree,
          contentItems
        ) => {
          const state = get()
          return calculateContentProgressWithHierarchy(
            contentId,
            hierarchyTree,
            contentItems,
            state.progress
          )
        },

        getUniverseProgress: (hierarchyTree, contentItems) => {
          const state = get()
          return calculateUniverseProgressWithHierarchy(
            hierarchyTree,
            contentItems,
            state.progress
          )
        },

        setProgress: async (contentId, universeId, progress) => {
          // Clamp progress between 0 and 100
          const clampedProgress = Math.max(0, Math.min(100, progress))

          // Optimistic update
          const currentProgress = get().progress.get(contentId) || 0

          set(
            state => {
              const newProgress = new Map(state.progress)
              newProgress.set(contentId, clampedProgress)

              return {
                ...state,
                progress: newProgress,
                isLoading: true,
              }
            },
            false,
            'progress/setProgress-optimistic'
          )

          try {
            // Call server action
            const result = await setContentProgressAction(
              contentId,
              universeId,
              clampedProgress
            )

            if (!result.success) {
              // Rollback optimistic update on error
              set(
                state => {
                  const rollbackProgress = new Map(state.progress)
                  rollbackProgress.set(contentId, currentProgress)

                  return {
                    ...state,
                    progress: rollbackProgress,
                    isLoading: false,
                  }
                },
                false,
                'progress/setProgress-rollback'
              )

              console.error('Failed to set progress:', result.error)
              return
            }

            // Success - optimistic update was correct
            set(
              state => ({ ...state, isLoading: false }),
              false,
              'progress/setProgress-success'
            )
          } catch (error) {
            // Network error - rollback optimistic update
            set(
              state => {
                const rollbackProgress = new Map(state.progress)
                rollbackProgress.set(contentId, currentProgress)

                return {
                  ...state,
                  progress: rollbackProgress,
                  isLoading: false,
                }
              },
              false,
              'progress/setProgress-error'
            )

            console.error('Network error setting progress:', error)
          }
        },

        setInitialProgress: progressMap =>
          set(
            {
              progress: new Map(Object.entries(progressMap)),
            },
            false,
            'progress/setInitial'
          ),

        loadInitialProgress: async () => {
          set(
            state => ({ ...state, isLoading: true }),
            false,
            'progress/loadStart'
          )

          try {
            const result = await getAllUserProgressAction()

            if (result.success && result.data) {
              set(
                {
                  progress: new Map(Object.entries(result.data)),
                  isLoading: false,
                },
                false,
                'progress/loadSuccess'
              )
            } else {
              console.error('Failed to load progress:', result.error)
              set(
                state => ({ ...state, isLoading: false }),
                false,
                'progress/loadError'
              )
            }
          } catch (error) {
            console.error('Network error loading progress:', error)
            set(
              state => ({ ...state, isLoading: false }),
              false,
              'progress/loadNetworkError'
            )
          }
        },

        loadUniverseProgress: async (universeId: string) => {
          set(
            state => ({ ...state, isLoading: true }),
            false,
            'progress/loadUniverseStart'
          )

          try {
            const result = await getUserProgressByUniverseAction(universeId)

            if (result.success && result.data) {
              set(
                {
                  progress: new Map(Object.entries(result.data)),
                  isLoading: false,
                },
                false,
                'progress/loadUniverseSuccess'
              )
            } else {
              console.error('Failed to load universe progress:', result.error)
              set(
                state => ({ ...state, isLoading: false }),
                false,
                'progress/loadUniverseError'
              )
            }
          } catch (error) {
            console.error('Network error loading universe progress:', error)
            set(
              state => ({ ...state, isLoading: false }),
              false,
              'progress/loadUniverseNetworkError'
            )
          }
        },

        clearProgress: contentId =>
          set(
            state => {
              const newProgress = new Map(state.progress)
              newProgress.delete(contentId)

              return {
                ...state,
                progress: newProgress,
              }
            },
            false,
            'progress/clearProgress'
          ),

        clearAllProgress: () =>
          set(
            {
              progress: new Map(),
            },
            false,
            'progress/clearAll'
          ),

        // Utility actions
        hasProgress: contentId => {
          const state = get()
          return state.progress.has(contentId)
        },

        getProgressCount: () => {
          const state = get()
          return state.progress.size
        },

        getCompletedCount: () => {
          const state = get()
          let completed = 0
          for (const progress of state.progress.values()) {
            if (progress >= 100) {
              completed++
            }
          }
          return completed
        },
      }),
      {
        name: 'canoncore-progress',
        storage: progressStorage,
        // Persist the entire state since it's all user data
      }
    ),
    {
      name: 'Progress Store',
    }
  )
)
