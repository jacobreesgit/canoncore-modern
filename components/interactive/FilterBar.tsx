'use client'

import { Button } from './Button'

export interface FilterOptions {
  sortBy: 'newest' | 'oldest' | 'name'
  showFilters?: boolean
}

interface FilterBarProps {
  currentFilters: FilterOptions
  onFiltersChange: (filters: FilterOptions) => void
  resultsCount: number
}

/**
 * Advanced filter controls for search results
 */
export function FilterBar({
  currentFilters,
  onFiltersChange,
  resultsCount,
}: FilterBarProps) {
  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    onFiltersChange({
      ...currentFilters,
      sortBy,
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      sortBy: 'newest',
      showFilters: false,
    })
  }

  return (
    <div className='bg-white rounded-lg shadow-sm p-4 border border-gray-200'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <span className='text-sm font-medium text-gray-700'>Sort by:</span>

          <div className='flex gap-2'>
            <Button
              variant={
                currentFilters.sortBy === 'newest' ? 'primary' : 'secondary'
              }
              size='sm'
              onClick={() => handleSortChange('newest')}
            >
              Newest
            </Button>
            <Button
              variant={
                currentFilters.sortBy === 'oldest' ? 'primary' : 'secondary'
              }
              size='sm'
              onClick={() => handleSortChange('oldest')}
            >
              Oldest
            </Button>
            <Button
              variant={
                currentFilters.sortBy === 'name' ? 'primary' : 'secondary'
              }
              size='sm'
              onClick={() => handleSortChange('name')}
            >
              Name (A-Z)
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <span className='text-sm text-gray-600'>
            {resultsCount} result{resultsCount !== 1 ? 's' : ''}
          </span>

          {currentFilters.sortBy !== 'newest' && (
            <Button variant='clear' size='sm' onClick={resetFilters}>
              Reset filters
            </Button>
          )}
        </div>
      </div>

      {/* Advanced filters placeholder - will be implemented later */}
    </div>
  )
}
