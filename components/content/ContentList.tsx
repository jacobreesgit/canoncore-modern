'use client'

import React, { useState, useMemo } from 'react'
import { Content } from '@/lib/types'
import { FormSelect } from '@/components/forms/FormSelect'
import { ContentDisplay } from './ContentDisplay'
import { SearchBar } from '@/components/interactive/SearchBar'
import { ContentListItem } from './ContentListItem'
import { getContentProgress } from '@/lib/utils/progress'

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
  sourceName?: string | null
  sourceBackgroundColor?: string | null
  sourceTextColor?: string | null
}

interface ContentListProps {
  content: ContentWithFavourite[]
  searchQuery?: string
  onSearchChange?: (query: string) => void
  actions?: React.ReactNode
}

const sortOptions = [
  { value: 'chronological', label: 'Chronological Order' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'progress', label: 'Progress' },
]

export function ContentList({
  content,
  searchQuery = '',
  onSearchChange,
  actions,
}: ContentListProps) {
  const [sortBy, setSortBy] = useState('chronological')
  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery)

  const effectiveSearchQuery = searchQuery || internalSearchQuery

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    if (onSearchChange) {
      onSearchChange(query)
    } else {
      setInternalSearchQuery(query)
    }
  }

  // Filter to viewable content only and apply search
  const filteredContent = useMemo(() => {
    const viewableContent = content.filter(item => item.isViewable)

    if (!effectiveSearchQuery.trim()) return viewableContent

    return viewableContent.filter(
      item =>
        item.name.toLowerCase().includes(effectiveSearchQuery.toLowerCase()) ||
        (item.description &&
          item.description
            .toLowerCase()
            .includes(effectiveSearchQuery.toLowerCase())) ||
        (item.sourceName &&
          item.sourceName
            .toLowerCase()
            .includes(effectiveSearchQuery.toLowerCase()))
    )
  }, [content, effectiveSearchQuery])

  // Sort content based on selected option
  const sortedContent = useMemo(() => {
    const sorted = [...filteredContent]

    switch (sortBy) {
      case 'alphabetical':
        return sorted.sort((a, b) => a.name.localeCompare(b.name))
      case 'progress':
        return sorted.sort(
          (a, b) => getContentProgress(b) - getContentProgress(a)
        )
      case 'chronological':
      default:
        return sorted.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
    }
  }, [filteredContent, sortBy])

  const hasItems = content.filter(item => item.isViewable).length > 0
  const hasResults = sortedContent.length > 0
  const isSearching = effectiveSearchQuery.trim().length > 0

  return (
    <ContentDisplay
      title={`Viewable Content (${sortedContent.length})`}
      description='Chronological view of all viewable content with source badges'
      actions={actions}
      isEmpty={!hasItems}
      emptyStateTitle='No viewable content yet'
      emptyStateDescription='Add some viewable content to see it in chronological order.'
    >
      {/* Search and Sort Controls */}
      {hasItems && (
        <div className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center gap-4'>
            {/* Search Section */}
            <div className='flex-1'>
              <SearchBar
                value={effectiveSearchQuery}
                onChange={handleSearchChange}
                placeholder='Search viewable content...'
              />
            </div>

            {/* Sort Controls */}
            <div className='flex items-center gap-2 flex-shrink-0'>
              <label htmlFor='sort-select' className='text-sm text-neutral-600'>
                Sort by:
              </label>
              <FormSelect
                name='sort'
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className='w-auto'
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {hasItems && !hasResults ? (
        <div className='text-center py-12'>
          <h3 className='text-lg font-medium text-neutral-900 mb-2'>
            No results found
          </h3>
          <p className='text-neutral-600 mb-4'>
            {isSearching
              ? 'No viewable content matches your search.'
              : 'Try adjusting your search terms.'}
          </p>
        </div>
      ) : hasItems && hasResults ? (
        <div className='space-y-3'>
          {sortedContent.map(item => (
            <ContentListItem key={item.id} item={item} />
          ))}
        </div>
      ) : null}
    </ContentDisplay>
  )
}

export default ContentList
