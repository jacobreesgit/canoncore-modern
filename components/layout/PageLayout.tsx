import React from 'react'
import { Navigation } from './Navigation'
import { PageHeader, PageHeaderProps } from './PageHeader'

interface PageLayoutProps {
  /** Current page for navigation highlighting */
  currentPage?: 'dashboard' | 'discover' | 'profile'
  /** Whether to show the navigation menu */
  showNavigationMenu?: boolean
  /** Page header configuration (optional) */
  header?: Omit<PageHeaderProps, 'className'>
  /** Page content */
  children: React.ReactNode
  /** Optional additional classes for the content area */
  contentClassName?: string
}

/**
 * Consistent page layout component
 *
 * Provides standardized structure with:
 * - Navigation bar
 * - Page header with surface styling
 * - Content area with consistent width and spacing
 */
export function PageLayout({
  currentPage = 'dashboard',
  showNavigationMenu = true,
  header,
  children,
  contentClassName = '',
}: PageLayoutProps) {
  return (
    <div className='min-h-screen bg-surface'>
      <Navigation
        showNavigationMenu={showNavigationMenu}
        currentPage={currentPage}
      />

      <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6'>
        {header && (
          <PageHeader
            {...header}
            className='bg-surface-elevated border border-surface-200 rounded-lg shadow-sm mb-6'
          />
        )}
        <div className={`${contentClassName}`.trim()}>{children}</div>
      </div>
    </div>
  )
}

export default PageLayout
