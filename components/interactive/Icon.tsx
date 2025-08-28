import React from 'react'
import { cn } from '@/lib/utils'

export interface IconProps
  extends Omit<React.SVGProps<SVGSVGElement>, 'size' | 'color'> {
  /** React icon component to render */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Standardized icon sizes */
  size?: 'xs' | 'sm' | 'default' | 'lg' | 'xl' | '2xl'
  /** Color using design tokens */
  color?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'neutral'
    | 'current'
  /** Hover color using design tokens */
  hoverColor?:
    | 'primary'
    | 'secondary'
    | 'success'
    | 'warning'
    | 'error'
    | 'neutral'
    | 'current'
  /** Animation type */
  animate?: 'pulse' | 'spin' | 'bounce' | 'none'
  /** Additional CSS classes */
  className?: string
  /** Accessibility label */
  'aria-label'?: string
}

export function Icon({
  icon: IconComponent,
  size = 'default',
  color = 'current',
  hoverColor,
  animate = 'none',
  className,
  'aria-label': ariaLabel,
  ...props
}: IconProps) {
  // Size class mapping
  const getSizeClasses = () => {
    switch (size) {
      case 'xs':
        return 'w-2.5 h-2.5'
      case 'sm':
        return 'w-3 h-3'
      case 'lg':
        return 'w-5 h-5'
      case 'xl':
        return 'w-6 h-6'
      case '2xl':
        return 'w-8 h-8'
      default:
        return 'w-4 h-4'
    }
  }

  // Color class mapping using design tokens
  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'text-primary-600'
      case 'secondary':
        return 'text-secondary-600'
      case 'success':
        return 'text-success-600'
      case 'warning':
        return 'text-warning-600'
      case 'error':
        return 'text-error-500'
      case 'neutral':
        return 'text-neutral-600'
      case 'current':
      default:
        return 'text-current'
    }
  }

  // Hover color class mapping using design tokens
  const getHoverColorClasses = () => {
    if (!hoverColor) return ''

    switch (hoverColor) {
      case 'primary':
        return 'hover:text-primary-600'
      case 'secondary':
        return 'hover:text-secondary-600'
      case 'success':
        return 'hover:text-success-600'
      case 'warning':
        return 'hover:text-warning-600'
      case 'error':
        return 'hover:text-error-500'
      case 'neutral':
        return 'hover:text-neutral-600'
      case 'current':
      default:
        return 'hover:text-current'
    }
  }

  // Animation class mapping
  const getAnimationClasses = () => {
    switch (animate) {
      case 'pulse':
        return 'animate-pulse'
      case 'spin':
        return 'animate-spin'
      case 'bounce':
        return 'animate-bounce'
      default:
        return ''
    }
  }

  const iconClasses = cn(
    'flex-shrink-0 transition-colors duration-200',
    getSizeClasses(),
    getColorClasses(),
    getHoverColorClasses(),
    getAnimationClasses(),
    className
  )

  return (
    <IconComponent className={iconClasses} aria-label={ariaLabel} {...props} />
  )
}
