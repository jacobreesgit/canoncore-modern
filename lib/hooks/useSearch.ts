import { useState, useMemo, useEffect, useCallback } from 'react'

export interface UseSearchOptions {
  keys: string[]
  fuseOptions?: Record<string, unknown>
  defaultMessage?: string
}

export interface UseSearchResult<T> {
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredResults: T[]
  searchResultsText?: string
  isSearching: boolean
}

const DEFAULT_FUSE_OPTIONS: Record<string, unknown> = {
  threshold: 0.3,
  location: 0,
  distance: 100,
  includeScore: false,
  includeMatches: false,
  minMatchCharLength: 1,
  shouldSort: true,
  findAllMatches: false,
  keys: [],
}

export function useSearch<T>(
  data: T[],
  {
    keys,
    fuseOptions = {},
    defaultMessage = 'Start typing to search...',
  }: UseSearchOptions
): UseSearchResult<T> {
  const [searchQuery, setSearchQueryInternal] = useState('')
  const [fuseInstance, setFuseInstance] = useState<unknown | null>(null)

  const stableKeys = useMemo(() => keys, [keys])

  const setSearchQuery = useCallback((query: string) => {
    setSearchQueryInternal(query)
  }, [])

  useEffect(() => {
    if (searchQuery.trim() && !fuseInstance && data?.length) {
      import('fuse.js').then(module => {
        const FuseConstructor = module.default
        try {
          const instance = new FuseConstructor(data, {
            ...DEFAULT_FUSE_OPTIONS,
            ...fuseOptions,
            keys: stableKeys,
          })
          setFuseInstance(instance)
        } catch (error) {
          // Use error tracking instead of console.warn
          import('@/lib/errors/error-tracking').then(({ errorTracker }) => {
            errorTracker.trackError(
              error,
              {
                type: 'search_initialization_error',
                component: 'useSearch',
                action: 'create_fuse_instance',
              },
              'low'
            )
          })
          setFuseInstance(null)
        }
      })
    } else if (!searchQuery.trim() && fuseInstance) {
      setFuseInstance(null)
    }
  }, [searchQuery, fuseInstance, data, stableKeys, fuseOptions])

  const filteredResults = useMemo(() => {
    if (!data?.length) return []
    if (!searchQuery.trim()) return data

    if (!fuseInstance) {
      return data.filter(
        item =>
          item &&
          stableKeys.some((key: string) => {
            const value = (item as Record<string, unknown>)[key]
            return (
              typeof value === 'string' &&
              value.toLowerCase().includes(searchQuery.toLowerCase())
            )
          })
      )
    }

    try {
      return (fuseInstance as { search: (query: string) => { item: T }[] })
        .search(searchQuery)
        .map(result => result.item)
    } catch (error) {
      // Use error tracking instead of console.warn
      import('@/lib/errors/error-tracking').then(({ errorTracker }) => {
        errorTracker.trackError(
          error,
          {
            type: 'search_execution_error',
            component: 'useSearch',
            action: 'fuse_search',
            searchQuery,
          },
          'low'
        )
      })
      return data
    }
  }, [fuseInstance, searchQuery, data, stableKeys])

  const searchResultsText = useMemo(() => {
    if (!searchQuery.trim()) return defaultMessage

    const count = filteredResults.length
    return `Showing ${count} result${count !== 1 ? 's' : ''} for "${searchQuery}"`
  }, [searchQuery, filteredResults.length, defaultMessage])

  return useMemo(
    () => ({
      searchQuery,
      setSearchQuery,
      filteredResults,
      searchResultsText,
      isSearching: searchQuery.trim().length > 0,
    }),
    [searchQuery, setSearchQuery, filteredResults, searchResultsText]
  )
}
