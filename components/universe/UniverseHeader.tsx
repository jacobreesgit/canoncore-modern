'use client'

import React, { useMemo } from 'react'
import { Universe, User } from '@/lib/types'
import { FavouriteButton } from '@/components/interactive/FavouriteButton'
import { Badge } from '@/components/content/Badge'
import { ProgressBar } from '@/components/content/ProgressBar'
import { Icon } from '@/components/interactive/Icon'
import { HiExternalLink } from 'react-icons/hi'

interface UniverseWithFavourite extends Universe {
  isFavourite?: boolean
}

interface UniverseHeaderProps {
  universe: UniverseWithFavourite
  universeOwner: User | null
  universeProgress: { percentage: number }
}

export function UniverseHeader({
  universe,
  universeOwner,
  universeProgress,
}: UniverseHeaderProps) {
  const headerMetadata = useMemo(
    () => (
      <div className='flex items-center gap-3'>
        {universe.isPublic ? (
          <Badge variant='public' size='small'>
            Public
          </Badge>
        ) : (
          <Badge variant='private' size='small'>
            Private
          </Badge>
        )}
        {universe.sourceLink && (
          <a
            href={
              universe.sourceLink.startsWith('http://') ||
              universe.sourceLink.startsWith('https://')
                ? universe.sourceLink
                : `https://${universe.sourceLink}`
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
              {universe.sourceLinkName || 'Source'}
            </Badge>
          </a>
        )}
        {universeOwner && (
          <span className='text-sm text-neutral-600'>
            Created by {universeOwner.name || universeOwner.email}
            {universe.createdAt && (
              <span suppressHydrationWarning>
                {' '}
                on {new Date(universe.createdAt).toLocaleDateString()}
              </span>
            )}
          </span>
        )}
      </div>
    ),
    [
      universe.isPublic,
      universe.sourceLink,
      universe.sourceLinkName,
      universe.createdAt,
      universeOwner,
    ]
  )

  const titleWithFavourite = useMemo(
    () => (
      <div className='flex items-center gap-2'>
        <span>{universe.name}</span>
        <FavouriteButton
          targetId={universe.id}
          targetType='universe'
          size='xl'
        />
      </div>
    ),
    [universe.name, universe.id]
  )

  const progressExtraContent = useMemo(
    () => (
      <ProgressBar
        variant='organisational'
        value={universeProgress.percentage}
        showLabel={true}
      />
    ),
    [universeProgress.percentage]
  )

  return {
    title: titleWithFavourite,
    description: universe.description || undefined,
    metadata: headerMetadata,
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: universe.name, href: `/universes/${universe.id}` },
    ],
    extraContent: progressExtraContent,
  }
}
