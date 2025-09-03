'use client'

import React, { useMemo } from 'react'
import { User, ContentWithSource } from '@/lib/types'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { Badge } from './Badge'
import { ProgressBar } from './ProgressBar'
import { Icon } from '@/components/interactive/Icon'
import { HiExternalLink } from 'react-icons/hi'
import { getContentProgress } from '@/lib/utils/progress'

interface ContentWithFavourite extends ContentWithSource {
  isFavourite?: boolean
}

interface ContentHeaderProps {
  content: ContentWithFavourite
  contentOwner: User | null
  universeName: string
  universeId: string
}

export function ContentHeader({
  content,
  contentOwner,
  universeName,
  universeId,
}: ContentHeaderProps) {
  const contentProgress = getContentProgress(content)

  const headerMetadata = useMemo(
    () => (
      <div className='flex items-center gap-3'>
        <Badge
          variant={content.isViewable ? 'info' : 'organisational'}
          size='small'
        >
          {content.isViewable ? 'Viewable' : 'Organisational'}
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
              content.itemType as
                | 'video'
                | 'audio'
                | 'text'
                | 'series'
                | 'phase'
                | 'character'
                | 'location'
            )
              ? (content.itemType as
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
            if (content.isViewable) {
              switch (content.itemType) {
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
              switch (content.itemType) {
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
        {content.sourceName && (
          <Badge
            variant='info'
            size='small'
            backgroundColor={content.sourceBackgroundColor || undefined}
            textColor={content.sourceTextColor || undefined}
          >
            From: {content.sourceName}
          </Badge>
        )}
        {content.sourceLink && (
          <a
            href={
              content.sourceLink.startsWith('http://') ||
              content.sourceLink.startsWith('https://')
                ? content.sourceLink
                : `https://${content.sourceLink}`
            }
            target='_blank'
            rel='noopener noreferrer'
            className='inline-block'
          >
            <Badge
              variant='info'
              size='small'
              className='hover:bg-primary-200 transition-colors cursor-pointer'
              icon={<Icon icon={HiExternalLink} size='sm' />}
            >
              {content.sourceLinkName || 'Source'}
            </Badge>
          </a>
        )}
        {contentOwner && (
          <span className='text-sm text-neutral-600'>
            Created by {contentOwner.name || contentOwner.email}
            {content.createdAt && (
              <span suppressHydrationWarning>
                {' '}
                on {new Date(content.createdAt).toLocaleDateString()}
              </span>
            )}
          </span>
        )}
      </div>
    ),
    [content, contentOwner]
  )

  const titleWithFavourite = useMemo(
    () => (
      <div className='flex items-center gap-2'>
        <span>{content.name}</span>
        <FavouriteButton targetId={content.id} targetType='content' size='xl' />
      </div>
    ),
    [content.name, content.id]
  )

  const progressExtraContent = useMemo(
    () => (
      <ProgressBar
        variant={content.isViewable ? 'viewable' : 'organisational'}
        value={contentProgress}
        showLabel={true}
      />
    ),
    [content.isViewable, contentProgress]
  )

  return {
    title: titleWithFavourite,
    description: content.description || undefined,
    metadata: headerMetadata,
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: universeName, href: `/universes/${universeId}` },
      { label: content.name, href: `/content/${content.id}` },
    ],
    extraContent: progressExtraContent,
  }
}
