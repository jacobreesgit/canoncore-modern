'use client'

import React from 'react'
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md'
import { useFavouritesStore } from '@/lib/stores/favourites-store'
import { cn } from '@/lib/utils'
import { IconButton } from './IconButton'
import { Icon } from './Icon'

/**
 * Modern Favourite Button Component
 *
 * Replaces the event-based FavouriteButtonClient with modern Zustand integration.
 *
 * Features:
 * - Zustand store integration for centralized state management
 * - Optimistic updates with automatic rollback on errors
 * - Server action integration with loading states
 * - Visual feedback and smooth animations
 * - No custom events - state automatically syncs across components
 * - Improved accessibility and keyboard navigation
 */

export interface FavouriteButtonProps {
  /** Target ID to favorite */
  targetId: string
  /** Target type */
  targetType: 'universe' | 'content'
  /** Optional custom class names */
  className?: string
  /** Whether to show text label */
  showText?: boolean
  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'xl'
}

export function FavouriteButton({
  targetId,
  targetType,
  className,
  showText = false,
  size = 'default',
}: FavouriteButtonProps) {
  const {
    _hasHydrated,
    isFavourite,
    toggleFavourite,
    isLoading: storeIsLoading,
  } = useFavouritesStore()

  // Use false until hydrated to prevent hydration mismatch
  const isFavorite = _hasHydrated ? isFavourite(targetId, targetType) : false
  const isLoading = storeIsLoading

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation when inside a Link
    e.stopPropagation()

    await toggleFavourite(targetId, targetType)
  }

  // Map size prop to IconButton size
  const getButtonSize = () => {
    switch (size) {
      case 'sm':
        return 'sm'
      case 'lg':
        return 'lg'
      case 'xl':
        return 'xl'
      default:
        return 'default'
    }
  }

  // Get text size classes for showText mode
  const getTextSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'text-xs'
      case 'lg':
        return 'text-base'
      case 'xl':
        return 'text-lg'
      default:
        return 'text-sm'
    }
  }

  // Get text container classes
  const getTextContainerClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 gap-1.5'
      case 'lg':
        return 'px-4 py-2 gap-2'
      case 'xl':
        return 'px-5 py-3 gap-2.5'
      default:
        return 'px-3 py-1.5 gap-2'
    }
  }

  // Text color classes
  const textClasses = cn(
    'transition-colors duration-200',
    getTextSizeClasses(),
    isFavorite ? 'text-error-500' : 'text-neutral-600 hover:text-error-500'
  )

  // Icon color - let IconButton handle base styling, we'll override with error color
  const iconColor = isFavorite ? 'error' : 'neutral'
  const iconHoverColor = 'error' // Always hover to error/red color

  // For icon-only mode, use IconButton directly
  if (!showText) {
    return (
      <IconButton
        icon={isFavorite ? MdFavorite : MdFavoriteBorder}
        size={getButtonSize()}
        iconColor={iconColor}
        iconHoverColor={iconHoverColor}
        loading={isLoading}
        disabled={isLoading}
        onClick={handleToggleFavorite}
        className={cn('favourite-button', className)}
        aria-label={
          isLoading
            ? 'Updating favourite status...'
            : isFavorite
              ? `Remove ${targetType} from favourites`
              : `Add ${targetType} to favourites`
        }
        title={
          isLoading
            ? 'Updating favourite status...'
            : isFavorite
              ? `Remove from favourites`
              : `Add to favourites`
        }
      />
    )
  }

  // For text mode, use custom button with IconButton-style classes
  const buttonClasses = cn(
    'favourite-button',
    'inline-flex items-center justify-center',
    'rounded-lg',
    getTextContainerClasses(),
    'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50',
    isLoading && 'opacity-50 cursor-not-allowed',
    !isLoading && 'cursor-pointer',
    className
  )

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={isLoading}
      className={cn(buttonClasses, 'group')}
      aria-label={
        isLoading
          ? 'Updating favourite status...'
          : isFavorite
            ? `Remove ${targetType} from favourites`
            : `Add ${targetType} to favourites`
      }
      title={
        isLoading
          ? 'Updating favourite status...'
          : isFavorite
            ? `Remove from favourites`
            : `Add to favourites`
      }
    >
      {/* Heart Icon using Icon component */}
      <Icon
        icon={isFavorite ? MdFavorite : MdFavoriteBorder}
        size={(() => {
          switch (size) {
            case 'sm':
              return 'sm'
            case 'lg':
              return 'lg'
            case 'xl':
              return 'xl'
            default:
              return 'default'
          }
        })()}
        color={iconColor}
        hoverColor={iconHoverColor}
        animate={isLoading ? 'pulse' : 'none'}
      />

      {/* Text Label */}
      <span className={textClasses}>
        {isLoading
          ? 'Updating...'
          : isFavorite
            ? 'Remove from favourites'
            : 'Add to favourites'}
      </span>
    </button>
  )
}
