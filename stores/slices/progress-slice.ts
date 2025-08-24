import { StateCreator } from 'zustand'
import {
  ContentWithProgress,
  calculateOrganisationalProgress,
} from '@/lib/utils/progress'
import {
  setContentProgressAction,
  getAllUserProgressAction,
} from '@/lib/actions/progress-actions'

export interface ProgressState {
  /** Map of contentId -> progress percentage (0-100) for viewable content */
  progress: Map<string, number>
  /** Map of contentId -> calculated progress for organisational content */
  calculatedProgress: Map<string, number>
  /** Set of contentIds currently being updated for loading states */
  loading: Set<string>
  /** Whether initial progress has been loaded */
  isInitialized: boolean
}

export interface ProgressActions {
  /** Set progress for viewable content with optimistic updates */
  setProgress: (
    contentId: string,
    universeId: string,
    progress: number
  ) => Promise<void>
  /** Set progress immediately (for initial load or calculated progress) */
  setProgressLocal: (contentId: string, progress: number) => void
  /** Get progress for any content (viewable or calculated) */
  getProgress: (contentId: string) => number
  /** Calculate and cache organisational progress */
  calculateAndCacheProgress: (
    contentId: string,
    children: ContentWithProgress[]
  ) => number
  /** Load initial progress from server */
  loadInitialProgress: (userId: string) => Promise<void>
  /** Check if content progress is currently loading */
  isLoading: (contentId: string) => boolean
  /** Reset store state */
  reset: () => void
}

export type ProgressSlice = ProgressState & ProgressActions

export const createProgressSlice: StateCreator<
  ProgressSlice,
  [],
  [],
  ProgressSlice
> = (set, get) => ({
  // Initial state
  progress: new Map(),
  calculatedProgress: new Map(),
  loading: new Set(),
  isInitialized: false,

  // Actions
  setProgress: async (
    contentId: string,
    universeId: string,
    progress: number
  ) => {
    const { loading } = get()

    // Prevent multiple simultaneous updates
    if (loading.has(contentId)) {
      return
    }

    // Validate progress range
    const normalizedProgress = Math.min(Math.max(progress, 0), 100)
    const currentProgress = get().progress.get(contentId) || 0

    // Optimistic update - immediately update UI
    set(state => ({
      progress: new Map(state.progress).set(contentId, normalizedProgress),
      loading: new Set(state.loading).add(contentId),
    }))

    try {
      // Call server action
      const result = await setContentProgressAction(
        contentId,
        universeId,
        normalizedProgress
      )

      if (result.success) {
        // Remove from loading state
        set(state => ({
          loading: new Set([...state.loading].filter(id => id !== contentId)),
        }))
      } else {
        // Server rejected - rollback optimistic update
        set(state => ({
          progress: new Map(state.progress).set(contentId, currentProgress),
          loading: new Set([...state.loading].filter(id => id !== contentId)),
        }))
        console.error('Error setting progress:', result.error)
      }
    } catch (error) {
      // Network error - rollback optimistic update
      set(state => ({
        progress: new Map(state.progress).set(contentId, currentProgress),
        loading: new Set([...state.loading].filter(id => id !== contentId)),
      }))
      console.error('Error setting progress:', error)
    }
  },

  setProgressLocal: (contentId: string, progress: number) => {
    const normalizedProgress = Math.min(Math.max(progress, 0), 100)
    set(state => ({
      progress: new Map(state.progress).set(contentId, normalizedProgress),
    }))
  },

  getProgress: (contentId: string) => {
    const { progress, calculatedProgress } = get()

    // First check viewable content progress
    const viewableProgress = progress.get(contentId)
    if (viewableProgress !== undefined) {
      return viewableProgress
    }

    // Then check calculated progress for organisational content
    const calcProgress = calculatedProgress.get(contentId)
    if (calcProgress !== undefined) {
      return calcProgress
    }

    return 0
  },

  calculateAndCacheProgress: (
    contentId: string,
    children: ContentWithProgress[]
  ) => {
    // Use the progress calculation utility
    const calculation = calculateOrganisationalProgress(children)
    const progressValue = calculation.percentage

    // Cache the calculated progress
    set(state => ({
      calculatedProgress: new Map(state.calculatedProgress).set(
        contentId,
        progressValue
      ),
    }))

    return progressValue
  },

  loadInitialProgress: async () => {
    try {
      const result = await getAllUserProgressAction()

      if (result.success && result.data) {
        set({
          progress: new Map(Object.entries(result.data)),
          isInitialized: true,
        })
      } else {
        console.error('Failed to load progress:', result.error)
        set({ isInitialized: true })
      }
    } catch (error) {
      console.error('Error loading progress:', error)
      set({ isInitialized: true })
    }
  },

  isLoading: (contentId: string) => {
    const { loading } = get()
    return loading.has(contentId)
  },

  reset: () => {
    set({
      progress: new Map(),
      calculatedProgress: new Map(),
      loading: new Set(),
      isInitialized: false,
    })
  },
})
