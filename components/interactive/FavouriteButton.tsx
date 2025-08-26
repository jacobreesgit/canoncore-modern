'use client'

import React from 'react'
import { MdFavorite, MdFavoriteBorder } from 'react-icons/md'
import { useFavouritesStore } from '@/lib/stores/favourites-store'
import { cn } from '@/lib/utils'

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
  size?: 'small' | 'default' | 'large' | 'xl'
  /** Optional variant for different visual styles */
  variant?: 'default' | 'subtle' | 'ghost'
}

export function FavouriteButton({
  targetId,
  targetType,
  className,
  showText = false,
  size = 'default',
  variant = 'default',
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

  // Get size classes for button and icon
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return {
          button: showText ? 'px-2 py-1 text-xs gap-1.5' : 'w-6 h-6 p-1',
          icon: 'w-3 h-3',
        }
      case 'large':
        return {
          button: showText ? 'px-4 py-2 text-base gap-2' : 'w-10 h-10 p-2',
          icon: 'w-5 h-5',
        }
      case 'xl':
        return {
          button: showText ? 'px-5 py-3 text-lg gap-2.5' : 'w-12 h-12 p-2.5',
          icon: 'w-6 h-6',
        }
      default:
        return {
          button: showText ? 'px-3 py-1.5 text-sm gap-2' : 'w-8 h-8 p-1.5',
          icon: 'w-4 h-4',
        }
    }
  }

  // Get variant styles
  const getVariantClasses = () => {
    const baseClasses =
      'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-opacity-50'

    switch (variant) {
      case 'subtle':
        return `${baseClasses} hover:bg-neutral-100m`
      case 'ghost':
        return `${baseClasses} hover:bg-transparent opacity-70 hover:opacity-100`
      default:
        return `${baseClasses} hover:bg-surface-secondary`
    }
  }

  const sizeClasses = getSizeClasses()
  const variantClasses = getVariantClasses()

  const buttonClasses = cn(
    'favourite-button',
    'inline-flex items-center justify-center',
    showText ? 'rounded-lg' : 'rounded-full',
    sizeClasses.button,
    variantClasses,
    isLoading && 'opacity-50 cursor-not-allowed',
    !isLoading && 'cursor-pointer',
    className
  )

  // Icon color classes
  const iconClasses = cn(
    sizeClasses.icon,
    'transition-all duration-200',
    isLoading && 'animate-pulse',
    isFavorite
      ? 'text-error-500'
      : 'text-neutral-400 hover:text-error-500 group-hover:text-error-500'
  )

  // Text color classes
  const textClasses = cn(
    'transition-colors duration-200',
    isFavorite ? 'text-error-500' : 'text-neutral-600 hover:text-error-500'
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
      {/* Heart Icon */}
      {isFavorite ? (
        <MdFavorite className={iconClasses} />
      ) : (
        <MdFavoriteBorder className={iconClasses} />
      )}

      {/* Optional Text Label */}
      {showText && (
        <span className={textClasses}>
          {isLoading
            ? 'Updating...'
            : isFavorite
              ? 'Remove from favourites'
              : 'Add to favourites'}
        </span>
      )}

      {/* Loading indicator for non-text buttons */}
      {isLoading && !showText && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-2 h-2 bg-neutral-400 rounded-full animate-pulse' />
        </div>
      )}
    </button>
  )
}
