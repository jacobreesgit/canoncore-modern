import React from 'react'
import { cn } from '@/lib/utils'
import { Icon, type IconProps } from './Icon'

export interface IconButtonProps
  extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    | 'size'
    | 'disabled'
    | 'onClick'
    | 'className'
    | 'aria-label'
    | 'title'
    | 'type'
  > {
  /** React icon component to render */
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  /** Icon size */
  iconSize?: IconProps['size']
  /** Icon color */
  iconColor?: IconProps['color']
  /** Icon hover color */
  iconHoverColor?: IconProps['color']
  /** Icon animation */
  iconAnimate?: IconProps['animate']

  /** Button size */
  size?: 'sm' | 'default' | 'lg' | 'xl'
  /** Disabled state */
  disabled?: boolean
  /** Loading state */
  loading?: boolean
  /** Round vs square button */
  rounded?: boolean

  /** Click handler */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
  /** Additional CSS classes */
  className?: string
  /** Accessibility label */
  'aria-label'?: string
  /** Tooltip text */
  title?: string
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
}

export function IconButton({
  icon,
  iconSize,
  iconColor = 'current',
  iconHoverColor,
  iconAnimate = 'none',

  size = 'default',
  disabled = false,
  loading = false,
  rounded = true,

  onClick,
  className,
  'aria-label': ariaLabel,
  title,
  type = 'button',
  ...props
}: IconButtonProps) {
  // Button size classes
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-6 h-6 p-1'
      case 'lg':
        return 'w-10 h-10 p-2'
      case 'xl':
        return 'w-12 h-12 p-2.5'
      default:
        return 'w-8 h-8 p-1.5'
    }
  }

  // Icon size based on button size if not explicitly set
  const getIconSize = (): IconProps['size'] => {
    if (iconSize) return iconSize

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

  // Variant style classes
  const getVariantClasses = () => {
    const baseClasses =
      'transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-opacity-50'

    return `${baseClasses} hover:bg-transparent text-neutral-400 hover:text-neutral-600 opacity-70 hover:opacity-100`
  }

  const buttonClasses = cn(
    'relative inline-flex items-center justify-center',
    rounded ? 'rounded-full' : 'rounded-lg',
    getSizeClasses(),
    getVariantClasses(),
    (disabled || loading) && 'opacity-50 cursor-not-allowed',
    !disabled && !loading && 'cursor-pointer',
    className
  )

  // Handle icon animation for loading state
  const iconAnimation = loading ? 'pulse' : iconAnimate

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={buttonClasses}
      aria-label={ariaLabel}
      title={title}
      {...props}
    >
      <Icon
        icon={icon}
        size={getIconSize()}
        color={iconColor}
        hoverColor={iconHoverColor}
        animate={iconAnimation}
      />

      {/* Loading indicator overlay */}
      {loading && (
        <div className='absolute inset-0 flex items-center justify-center'>
          <div className='w-2 h-2 bg-current rounded-full animate-pulse opacity-60' />
        </div>
      )}
    </button>
  )
}
