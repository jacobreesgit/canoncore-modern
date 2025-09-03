'use client'

import React from 'react'
import { Content, Universe } from '@/lib/types'
import { Tree } from './Tree'
import { ButtonLink } from '@/components/interactive/Button'
import { type HierarchyNode } from '@/lib/utils/progress'
import { HiEye, HiCollection } from 'react-icons/hi'

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
}

interface ContentContextProps {
  content: Content
  universe: Universe
  universeContent: ContentWithFavourite[]
  hierarchyTree: HierarchyNode[]
  isUniverseOwner: boolean
}

export function ContentContext({
  content,
  universe,
  universeContent,
  hierarchyTree,
  isUniverseOwner,
}: ContentContextProps) {
  return (
    <Tree
      hierarchyTree={hierarchyTree}
      content={universeContent}
      title={`Related Content in ${universe.name}`}
      description={`Content hierarchy showing ${content.name} in context`}
      variant='context'
      currentContentId={content.id}
      actions={
        isUniverseOwner ? (
          <div className='flex gap-2 justify-center'>
            <ButtonLink
              href={`/universes/${universe.id}/content/add-viewable`}
              variant='primary'
              icon={<HiEye className='h-4 w-4' />}
            >
              Add Viewable Content
            </ButtonLink>
            <ButtonLink
              href={`/universes/${universe.id}/content/organise`}
              variant='accent'
              icon={<HiCollection className='h-4 w-4' />}
            >
              Add Organization
            </ButtonLink>
          </div>
        ) : undefined
      }
    />
  )
}
