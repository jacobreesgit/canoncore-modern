'use client'

import { useState, useMemo, ReactNode } from 'react'
import { SearchBar } from '@/components/interactive/SearchBar'
import { Button } from '@/components/interactive/Button'

export interface FilterOption {
  key: string
  label: string
  value: string
}

export interface ContentDisplayProps<T = unknown> {
  /** Items to display */
  items: T[]
  /** Display mode */
  displayMode: 'grid' | 'tree' | 'list'
  /** Whether to show search functionality */
  searchable?: boolean
  /** Whether to show filter functionality */
  filterable?: boolean
  /** Filter options configuration */
  filterOptions?: FilterOption[]
  /** Current filter state */
  currentFilter?: string
  /** Search placeholder text */
  searchPlaceholder?: string
  /** Function to render each item */
  renderItem: (item: T, index: number) => ReactNode
  /** Function to render tree structure (if displayMode is 'tree') */
  renderTree?: (items: T[]) => ReactNode
  /** Function to extract searchable text from items */
  getSearchText?: (item: T) => string
  /** Function to filter items */
  filterItems?: (items: T[], filterKey: string) => T[]
  /** Empty state content */
  emptyState?: ReactNode
  /** Empty state title */
  emptyStateTitle?: string
  /** Empty state description */
  emptyStateDescription?: string
  /** Button that appears in header when items exist, or in empty state when no items */
  button?: ReactNode
  /** No results state content */
  noResultsState?: ReactNode
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Additional header actions */
  headerActions?: ReactNode
  /** Container className */
  className?: string
  /** Grid layout classes (when displayMode is 'grid') */
  gridClasses?: string
  /** Callback when search changes */
  onSearchChange?: (query: string) => void
  /** Callback when filter changes */
  onFilterChange?: (filter: string) => void
}

/**
 * Reusable ContentDisplay component
 *
 * Supports multiple display modes (grid, tree, list) with consistent
 * search and filter functionality across the application.
 */
export function ContentDisplay<T>({
  items,
  displayMode = 'grid',
  searchable = true,
  filterable = true,
  filterOptions = [
    { key: 'newest', label: 'Newest', value: 'newest' },
    { key: 'oldest', label: 'Oldest', value: 'oldest' },
    { key: 'name', label: 'Name (A-Z)', value: 'name' },
  ],
  currentFilter = 'newest',
  searchPlaceholder = 'Search...',
  renderItem,
  renderTree,
  getSearchText = (item: T) => (item as { name?: string }).name || String(item),
  filterItems,
  emptyState,
  emptyStateTitle = 'No items yet',
  emptyStateDescription = 'Get started by adding your first item.',
  button,
  noResultsState,
  title,
  description,
  headerActions,
  className = '',
  gridClasses = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  onSearchChange,
  onFilterChange,
}: ContentDisplayProps<T>) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState(currentFilter)

  // Filter and search items
  const processedItems = useMemo(() => {
    let result = items

    // Apply custom filter if provided
    if (filterItems && activeFilter) {
      result = filterItems(result, activeFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(item =>
        getSearchText(item).toLowerCase().includes(query)
      )
    }

    return result
  }, [items, searchQuery, activeFilter, filterItems, getSearchText])

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onSearchChange?.(query)
  }

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter)
    onFilterChange?.(filter)
  }

  const clearSearch = () => {
    setSearchQuery('')
    onSearchChange?.('')
  }

  // Show search and filter controls
  const showControls = searchable || filterable
  const hasItems = items.length > 0
  const hasResults = processedItems.length > 0
  const isSearching = searchQuery.trim().length > 0

  // If no items and no controls, don't use card styling
  if (!hasItems && !showControls && !(title || description || headerActions)) {
    return (
      <div className={`content-display ${className}`}>
        {emptyState || (
          <div className='text-center'>
            <div className='max-w-md mx-auto'>
              <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                No items yet
              </h3>
              <p className='text-neutral-600'>
                Get started by adding your first item.
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`content-display bg-surface-elevated rounded-lg shadow-sm border border-surface-200 ${className}`}
    >
      <div className='p-6'>
        {/* Header */}
        {(title || description || headerActions || (hasItems && button)) && (
          <div className='flex justify-between items-start mb-6'>
            <div>
              {title && (
                <h2 className='text-xl font-semibold text-neutral-900 mb-2'>
                  {title}
                </h2>
              )}
              {description && <p className='text-neutral-600'>{description}</p>}
            </div>
            <div className='flex items-center gap-3 flex-shrink-0'>
              {hasItems && button && <div>{button}</div>}
              {headerActions && <div>{headerActions}</div>}
            </div>
          </div>
        )}

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

              {/* Filter Section */}
              {filterable && (
                <div className='flex items-center gap-4 flex-wrap'>
                  <span className='text-sm font-medium text-neutral-700 whitespace-nowrap'>
                    Sort by:
                  </span>
                  <div className='flex gap-1.5'>
                    {filterOptions.map(option => (
                      <Button
                        key={option.key}
                        variant={
                          activeFilter === option.value
                            ? 'primary'
                            : 'secondary'
                        }
                        size='small'
                        onClick={() => handleFilterChange(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className='content-display-body'>
          {!hasItems ? (
            // No items at all
            <div className='text-center py-12'>
              <div className='max-w-md mx-auto'>
                {emptyState || (
                  <>
                    <h3 className='text-lg font-medium text-neutral-900 mb-2'>
                      {emptyStateTitle}
                    </h3>
                    <p className='text-neutral-600 mb-6'>
                      {emptyStateDescription}
                    </p>
                    {button && <div>{button}</div>}
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
            // Display items
            <>
              {displayMode === 'tree' && renderTree ? (
                renderTree(processedItems)
              ) : displayMode === 'list' ? (
                <div className='space-y-4'>
                  {processedItems.map((item, index) => (
                    <div key={index}>{renderItem(item, index)}</div>
                  ))}
                </div>
              ) : (
                // Grid mode (default)
                <div
                  className={`${gridClasses} grid-rows-[repeat(auto-fit,1fr)]`}
                >
                  {processedItems.map((item, index) => (
                    <div key={index}>{renderItem(item, index)}</div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
