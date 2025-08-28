'use client'

import { ReactNode } from 'react'

export interface ContentDisplayProps {
  /** Section title */
  title?: string
  /** Section description */
  description?: string
  /** Button that appears in header */
  button?: ReactNode
  /** Additional header actions */
  headerActions?: ReactNode
  /** Content to display */
  children: ReactNode
  /** Container className */
  className?: string
}

/**
 * Pure styling component for consistent content display
 *
 * Provides consistent card styling, headers, and layout across
 * all content types without any business logic.
 */
export function ContentDisplay({
  title,
  description,
  button,
  headerActions,
  children,
  className = '',
}: ContentDisplayProps) {
  return (
    <div
      className={`content-display bg-surface-elevated rounded-lg shadow-sm border border-surface-200 ${className}`}
    >
      <div className='p-6'>
        {/* Header */}
        {(title || description || button || headerActions) && (
          <div className='flex justify-between items-start mb-6'>
            <div>
              {title && (
                <h2 className='text-xl font-semibold text-neutral-900 mb-2'>
                  {title}
                </h2>
              )}
              {description && <p className='text-neutral-600'>{description}</p>}
            </div>
            <div className='flex items-center gap-3 flex-shrink-0'>
              {button && <div>{button}</div>}
              {headerActions && <div>{headerActions}</div>}
            </div>
          </div>
        )}

        {/* Content */}
        <div className='content-display-body'>{children}</div>
      </div>
    </div>
  )
}
