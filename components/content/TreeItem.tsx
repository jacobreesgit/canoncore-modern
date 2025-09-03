'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { HiChevronRight, HiChevronDown } from 'react-icons/hi'
import { Icon } from '@/components/interactive/Icon'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { ProgressBar } from './ProgressBar'
import { Badge } from './Badge'
import { getContentProgress } from '@/lib/utils/progress'
import Link from 'next/link'

interface TreeItemProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any // Item instance from headless-tree
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemData: any
  index: number
}

export function TreeItem({ item, itemData }: TreeItemProps) {
  return (
    <div
      {...item.getProps()}
      key={item.getId()}
      style={{ paddingLeft: `${item.getItemMeta().level * 32}px` }}
      className='w-full text-left'
    >
      <div
        className={cn(
          'treeitem flex flex-col items-center rounded-lg p-2 cursor-pointer',
          {
            focused: item.isFocused(),
            expanded: item.isExpanded(),
            folder: item.isFolder(),
          }
        )}
      >
        <div className='flex items-center justify-between w-full'>
          <div className='flex items-center gap-3'>
            <div className='flex items-center gap-2'>
              {item.isFolder() && (
                <Icon
                  icon={item.isExpanded() ? HiChevronDown : HiChevronRight}
                  color='neutral'
                  noPadding
                  className='flex-shrink-0 cursor-pointer'
                />
              )}
              <div className='flex items-center'>
                <Link
                  href={`/content/${itemData.id}`}
                  className='truncate hover:text-primary-600 transition-colors cursor-pointer'
                >
                  {item.getItemName()}
                </Link>
                <FavouriteButton
                  targetId={itemData.id}
                  targetType='content'
                  size='default'
                />
              </div>
            </div>

            {/* Badges */}
            <div className='flex items-center gap-1'>
              <Badge
                variant={itemData.isViewable ? 'info' : 'organisational'}
                size='small'
              >
                {itemData.isViewable ? 'Viewable' : 'Organisational'}
              </Badge>
              <Badge
                variant={
                  (
                    [
                      'video',
                      'audio',
                      'text',
                      'series',
                      'phase',
                      'character',
                      'location',
                    ] as const
                  ).includes(
                    itemData.itemType as
                      | 'video'
                      | 'audio'
                      | 'text'
                      | 'series'
                      | 'phase'
                      | 'character'
                      | 'location'
                  )
                    ? (itemData.itemType as
                        | 'video'
                        | 'audio'
                        | 'text'
                        | 'series'
                        | 'phase'
                        | 'character'
                        | 'location')
                    : 'private'
                }
                size='small'
              >
                {(() => {
                  if (itemData.isViewable) {
                    switch (itemData.itemType) {
                      case 'video':
                        return 'Movie'
                      case 'audio':
                        return 'Audio'
                      case 'text':
                        return 'Book'
                      default:
                        return 'Media'
                    }
                  } else {
                    switch (itemData.itemType) {
                      case 'series':
                        return 'Series'
                      case 'phase':
                        return 'Phase'
                      case 'character':
                        return 'Character'
                      case 'location':
                        return 'Location'
                      case 'other':
                        return 'Other'
                      default:
                        return 'Org'
                    }
                  }
                })()}
              </Badge>
            </div>
          </div>
          <ProgressBar
            value={getContentProgress(itemData)}
            variant={itemData.isViewable ? 'viewable' : 'organisational'}
            showLabel={true}
            showBar={false}
          />
        </div>
        {/* Content Description */}
        {itemData.description && (
          <div
            className={cn('text-sm text-neutral-600 line-clamp-2 w-full', {
              'pl-6': item.isFolder(),
            })}
          >
            {itemData.description}
          </div>
        )}
      </div>
    </div>
  )
}

export default TreeItem
