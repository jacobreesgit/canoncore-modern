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
 * Sort controls for search results
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

  const resetSort = () => {
    onFiltersChange({
      sortBy: 'newest',
      showFilters: false,
    })
  }

  return (
    <div className='bg-white rounded-lg shadow-sm p-6 border border-neutral-200'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <span className='text-sm font-medium text-neutral-700'>Sort by:</span>

          <div className='flex gap-2'>
            <Button
              variant={
                currentFilters.sortBy === 'newest' ? 'primary' : 'secondary'
              }
              size='small'
              onClick={() => handleSortChange('newest')}
            >
              Newest
            </Button>
            <Button
              variant={
                currentFilters.sortBy === 'oldest' ? 'primary' : 'secondary'
              }
              size='small'
              onClick={() => handleSortChange('oldest')}
            >
              Oldest
            </Button>
            <Button
              variant={
                currentFilters.sortBy === 'name' ? 'primary' : 'secondary'
              }
              size='small'
              onClick={() => handleSortChange('name')}
            >
              Name (A-Z)
            </Button>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <span className='text-sm text-neutral-600'>
            {resultsCount} result{resultsCount !== 1 ? 's' : ''}
          </span>

          {currentFilters.sortBy !== 'newest' && (
            <Button variant='clear' size='small' onClick={resetSort}>
              Reset sort
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
