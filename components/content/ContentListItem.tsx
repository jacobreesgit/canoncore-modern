'use client'

import React from 'react'
import Link from 'next/link'
import { Content } from '@/lib/types'
import { Badge } from './Badge'
import { ProgressBar } from './ProgressBar'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { getContentProgress } from '@/lib/utils/progress'
import { cn } from '@/lib/utils'

interface ContentWithFavourite extends Content {
  isFavourite?: boolean
  sourceName?: string | null
  sourceBackgroundColor?: string | null
  sourceTextColor?: string | null
}

interface ContentListItemProps {
  item: ContentWithFavourite
}

export function ContentListItem({ item }: ContentListItemProps) {
  return (
    <Link
      href={`/content/${item.id}`}
      className={cn(
        'block bg-white border border-neutral-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-4 w-full'
      )}
    >
      <div className='flex items-center justify-between w-full'>
        <div className='flex items-center gap-3'>
          <div className='flex items-center gap-2'>
            <h3 className='text-lg font-medium text-neutral-900 truncate'>
              {item.name}
            </h3>
            <FavouriteButton
              targetId={item.id}
              targetType='content'
              size='default'
            />
          </div>

          {/* Badges */}
          <div className='flex items-center gap-1'>
            <Badge variant='info' size='small'>
              Viewable
            </Badge>
            <Badge
              variant={item.itemType as 'video' | 'audio' | 'text'}
              size='small'
            >
              {(() => {
                switch (item.itemType) {
                  case 'video':
                    return 'Movie'
                  case 'audio':
                    return 'Audio'
                  case 'text':
                    return 'Book'
                  default:
                    return 'Media'
                }
              })()}
            </Badge>

            {/* Source Badge - Only show for viewable content with sources */}
            {item.sourceName &&
              item.sourceBackgroundColor &&
              item.sourceTextColor && (
                <Badge
                  variant='info'
                  size='small'
                  backgroundColor={item.sourceBackgroundColor}
                  textColor={item.sourceTextColor}
                >
                  From: {item.sourceName}
                </Badge>
              )}
          </div>
        </div>
        <ProgressBar
          value={getContentProgress(item)}
          variant='viewable'
          showLabel={true}
          showBar={false}
        />
      </div>
      {/* Content Description */}
      {item.description && (
        <div className='text-sm text-neutral-600 line-clamp-2 w-full'>
          {item.description}
        </div>
      )}
    </Link>
  )
}

export default ContentListItem
