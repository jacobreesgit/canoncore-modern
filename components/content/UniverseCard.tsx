'use client'

import React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ProgressBar } from './ProgressBar'
import { Badge } from './Badge'
import { FavouriteButton } from '../interactive/FavouriteButton'

export interface Universe {
  id: string
  name: string
  description?: string
  isPublic: boolean
  userId: string
  progress?: number
}

export interface UniverseCardProps {
  variant?: 'dashboard' | 'profile' | 'discover'
  className?: string
  universe: Universe
  href: string
  showFavourite?: boolean
  showOwner?: boolean
  ownerName?: string
  showOwnerBadge?: boolean
  currentUserId?: string
}

export function UniverseCard({
  className = '',
  universe,
  href,
  showFavourite = false,
  showOwner = false,
  ownerName,
  showOwnerBadge = false,
  currentUserId,
}: UniverseCardProps) {
  const progress = universe.progress ?? 0
  return (
    <Link
      href={href}
      className={cn(
        'block bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer p-6',
        className
      )}
    >
      <div>
        {/* Header */}
        <div className='mb-3'>
          <div className='flex items-center justify-between mb-2'>
            <div className='flex items-center space-x-2 min-w-0 flex-1'>
              <h3 className='text-lg font-medium text-gray-900 truncate'>
                {universe.name}
              </h3>
              {showFavourite && (
                <FavouriteButton
                  targetId={universe.id}
                  targetType='universe'
                  className='flex-shrink-0'
                  variant='subtle'
                />
              )}
            </div>
          </div>
          <div className='flex items-center space-x-2 flex-wrap gap-1'>
            <Badge
              variant={universe.isPublic ? 'public' : 'private'}
              size='small'
            >
              {universe.isPublic ? 'Public' : 'Private'}
            </Badge>
            {showOwnerBadge && currentUserId === universe.userId && (
              <Badge variant='owner' size='small'>
                Your Universe
              </Badge>
            )}
            {showOwner && ownerName && currentUserId !== universe.userId && (
              <Badge variant='info' size='small'>
                by {ownerName}
              </Badge>
            )}
          </div>
        </div>

        {/* Description */}
        {universe.description && (
          <p className='text-gray-600 text-sm mb-4 line-clamp-3'>
            {universe.description}
          </p>
        )}

        {/* Progress */}
        <div>
          <ProgressBar
            variant='organisational'
            value={progress}
            showLabel={true}
            label='Progress'
          />
        </div>
      </div>
    </Link>
  )
}

export default UniverseCard
