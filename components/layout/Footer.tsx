import React from 'react'
import { APP_VERSION } from '@/lib/utils/version'

/**
 * Footer component with version display
 *
 * Displays copyright information and app version
 * Positioned at the bottom of pages with consistent styling
 */
export interface FooterProps {
  /** Optional custom class names */
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  return (
    <footer
      className={`border-t border-gray-200 bg-white flex-shrink-0 ${className}`}
    >
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
        <div className='flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500'>
          <div className='mb-2 sm:mb-0'>
            <span>&copy; {new Date().getFullYear()} CanonCore</span>
          </div>
          <div className='flex items-center gap-4'>
            <span>Version {APP_VERSION}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
