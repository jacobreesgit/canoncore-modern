'use client'

import { useState, useMemo, ReactNode } from 'react'
import { ContentDisplay } from './ContentDisplay'
import { SearchBar } from '@/components/interactive/SearchBar'
import { Button } from '@/components/interactive/Button'

export interface ContentGridProps<T = unknown> {
  /** Items to display */
  items: T[]
  /** Whether to show search functionality */
  searchable?: boolean
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode
  /** Function to extract searchable text from items */
  getSearchText?: (item: T) => string
  /** Function to filter items (for sorting/filtering) */
  filterItems?: (items: T[], sortBy: string) => T[]
  /** Empty state content */
  emptyState?: ReactNode
  /** Empty state title */
  emptyStateTitle?: string
  /** Empty state description */
  emptyStateDescription?: string
  /** Actions that appear in header when items exist, or in empty state when no items */
  actions?: ReactNode
  /** No results state content */
  noResultsState?: ReactNode
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Container className */
  className?: string
  /** Grid layout classes */
  gridClasses?: string
  /** Callback when search changes */
  onSearchChange?: (query: string) => void
}

/**
 * Grid-specific content display component
 *
 * Uses ContentDisplay for consistent styling while handling
 * grid-specific search and filter functionality.
 */
export function ContentGrid<T>({
  items,
  searchable = true,
  searchPlaceholder = 'Search...',
  renderItem,
  getSearchText = (item: T) => (item as { name?: string }).name || String(item),
  emptyState,
  emptyStateTitle = 'No items yet',
  emptyStateDescription = 'Get started by adding your first item.',
  actions,
  noResultsState,
  title,
  description,
  className = '',
  gridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  onSearchChange,
}: ContentGridProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')

  // Search items
  const processedItems = useMemo(() => {
    let result = items

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        getSearchText(item).toLowerCase().includes(query)
      )
    }

    return result
  }, [items, searchQuery, getSearchText])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  const clearSearch = () => {
    setSearchQuery('')
    onSearchChange?.('')
  }

  const hasItems = items.length > 0
  const hasResults = processedItems.length > 0
  const isSearching = searchQuery.trim().length > 0
  const showControls = searchable

  return (
    <ContentDisplay
      title={title}
      description={description}
      actions={actions}
      className={className}
    >
      {/* Search and Filter Controls */}
      {showControls && hasItems && (
        <div className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
            {/* Search Section */}
            {searchable && (
              <div className='flex-1'>
                <SearchBar
                  value={searchQuery}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder={searchPlaceholder}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {!hasItems ? (
        // No items at all
        <div className='text-center py-12'>
          <div className='max-w-md mx-auto'>
            {emptyState || (
              <>
                <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                  {emptyStateTitle}
                </h3>
                <p className='text-neutral-600 mb-6'>{emptyStateDescription}</p>
                {actions && <div>{actions}</div>}
              </>
            )}
          </div>
        </div>
      ) : !hasResults ? (
        // No search results
        noResultsState || (
          <div className='text-center'>
            <div className='max-w-md mx-auto'>
              <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                {isSearching
                  ? 'No results found'
                  : 'No items match your filters'}
              </h3>
              <p className='text-neutral-600 mb-4'>
                {isSearching
                  ? 'Try adjusting your search terms.'
                  : 'Try different filter options.'}
              </p>
              {isSearching && (
                <Button variant='secondary' onClick={clearSearch}>
                  Clear Search
                </Button>
              )}
            </div>
          </div>
        )
      ) : (
        // Display items in grid
        <div className={`${gridClasses} grid-rows-[repeat(auto-fit,1fr)]`}>
          {processedItems.map((item, index) => (
            <div key={index}>{renderItem(item, index)}</div>
          ))}
        </div>
      )}
    </ContentDisplay>
  )
}
