'use client'

import React, { useState } from 'react'
import { Content } from '@/lib/types'
import { Tree } from '@/components/content/Tree'
import { ContentList } from '@/components/content/ContentList'
import { Button } from '@/components/interactive/Button'
import { type HierarchyNode } from '@/lib/utils/progress'
import { HiViewList, HiViewGrid } from 'react-icons/hi'

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
}

interface UniverseContentProps {
  content: ContentWithFavourite[]
  hierarchyTree: HierarchyNode[]
  searchQuery?: string
  viewMode: 'tree' | 'flat'
  onViewModeChange: (mode: 'tree' | 'flat') => void
}

export function UniverseContent({
  content,
  hierarchyTree,
  viewMode,
  onViewModeChange,
}: UniverseContentProps) {
  const [searchQuery] = useState('')

  // Create view toggle buttons for ContentDisplay actions
  const viewToggleActions = (
    <>
      <Button
        variant={viewMode === 'tree' ? 'primary' : 'secondary'}
        size='small'
        icon={<HiViewGrid className='h-4 w-4' />}
        onClick={() => onViewModeChange('tree')}
      >
        Tree View
      </Button>
      <Button
        variant={viewMode === 'flat' ? 'primary' : 'secondary'}
        size='small'
        icon={<HiViewList className='h-4 w-4' />}
        onClick={() => onViewModeChange('flat')}
      >
        Flat View
      </Button>
    </>
  )

  return (
    <div className='space-y-4'>
      {/* Content Display */}
      {viewMode === 'tree' ? (
        <Tree
          hierarchyTree={hierarchyTree}
          content={content}
          title={`Content Hierarchy (${content.length})`}
          description='Hierarchical view of all content with organizational structure and relationships'
          searchable={true}
          searchPlaceholder='Search content...'
          actions={viewToggleActions}
        />
      ) : (
        <ContentList
          content={content}
          searchQuery={searchQuery}
          actions={viewToggleActions}
        />
      )}
    </div>
  )
}
