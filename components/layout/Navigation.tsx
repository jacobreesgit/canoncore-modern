'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { HiMenu, HiX } from 'react-icons/hi'
import { Button, ButtonLink } from '@/components/interactive/Button'
import { Icon } from '@/components/interactive/Icon'

/**
 * Navigation component with responsive design and auth integration
 *
 * Features:
 * - Responsive hamburger menu for mobile
 * - Auth state integration with user menu
 * - Active route highlighting
 * - Support for custom actions
 */

export interface NavigationAction {
  /** Action type determines styling */
  type: 'primary' | 'secondary' | 'danger' | 'text'
  /** Action label */
  label: string
  /** Link destination for link actions */
  href?: string
  /** Click handler for button actions */
  onClick?: () => void
  /** Disabled state */
  disabled?: boolean
}

export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional custom class names */
  className?: string
  /** Right-side action buttons */
  actions?: NavigationAction[]
  /** Show full navigation menu (Dashboard/Discover links) */
  showNavigationMenu?: boolean
  /** Current page for active state styling */
  currentPage?: 'dashboard' | 'discover' | 'profile'
  /** Show sign out button */
  showSignOut?: boolean
}

/**
 * Base navigation styles
 */
const baseStyles = 'bg-white shadow-sm relative'

/**
 * Navigation component
 */
export function Navigation({
  className = '',
  actions = [],
  showNavigationMenu = true,
  currentPage,
  showSignOut,
}: NavigationProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Auto-determine current page from pathname if not provided
  const determineCurrentPage = () => {
    if (currentPage) return currentPage
    if (pathname === '/' || pathname === '/dashboard') return 'dashboard'
    if (pathname === '/discover') return 'discover'
    if (pathname?.startsWith('/profile/')) return 'profile'
    return undefined
  }

  const activePage = determineCurrentPage()

  // Auto-determine showSignOut: explicit prop or only on profile pages
  const shouldShowSignOut =
    showSignOut !== undefined ? showSignOut : activePage === 'profile'

  const navigationClasses = ['navigation', baseStyles, className]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  const getLinkClasses = (page: string) => {
    const isActive = activePage === page
    return isActive
      ? 'text-primary-600 font-medium'
      : 'text-surface-600 hover:text-surface-900 font-medium transition-colors'
  }

  const handleSignOut = () => {
    signOut()
    setIsMobileMenuOpen(false)
  }

  return (
    <nav className={navigationClasses}>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Left side: Brand + Navigation */}
          <div className='flex items-center space-x-8'>
            {/* CanonCore Brand */}
            {activePage === 'dashboard' ? (
              <span className='text-xl font-bold text-primary-600'>
                CanonCore
              </span>
            ) : (
              <Link
                href='/dashboard'
                className='text-xl font-bold text-primary-600 hover:text-primary-700 transition-colors'
              >
                CanonCore
              </Link>
            )}

            {/* Navigation Menu - Desktop only */}
            {showNavigationMenu && (
              <div className='hidden md:flex space-x-6'>
                <Link href='/dashboard' className={getLinkClasses('dashboard')}>
                  Dashboard
                </Link>
                <Link href='/discover' className={getLinkClasses('discover')}>
                  Discover
                </Link>
                {session?.user && (
                  <Link
                    href={`/profile/${session.user.id}`}
                    className={getLinkClasses('profile')}
                  >
                    {session.user.name || session.user.email}
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* Right side: Actions + User menu + Hamburger (mobile) */}
          <div className='flex items-center space-x-3'>
            {/* Custom actions - Desktop only */}
            <div className='hidden md:flex items-center space-x-3'>
              {actions.map((action, index) => (
                <React.Fragment key={index}>
                  {action.href ? (
                    <ButtonLink
                      href={action.href}
                      variant={action.type === 'text' ? 'clear' : action.type}
                    >
                      {action.label}
                    </ButtonLink>
                  ) : (
                    <Button
                      onClick={action.onClick}
                      disabled={action.disabled}
                      variant={action.type === 'text' ? 'clear' : action.type}
                    >
                      {action.label}
                    </Button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* User authentication elements */}
            {session?.user && (
              <div className='hidden md:flex items-center space-x-4'>
                {/* User greeting - only show when nav menu is not shown */}
                {!showNavigationMenu && (
                  <span className='text-surface-700'>
                    Welcome, {session.user.name || session.user.email}
                  </span>
                )}

                {/* Sign out button - always show when authenticated */}
                <Button onClick={handleSignOut} variant='secondary'>
                  Sign out
                </Button>
              </div>
            )}

            {/* Mobile hamburger menu button */}
            {showNavigationMenu && (
              <Button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                variant='clear'
                className='md:hidden p-2 text-surface-600 hover:text-surface-900 transition-colors'
                aria-label='Toggle mobile menu'
              >
                {isMobileMenuOpen ? (
                  <Icon
                    icon={HiX}
                    size='xl'
                    className='transition-transform duration-200'
                  />
                ) : (
                  <Icon
                    icon={HiMenu}
                    size='xl'
                    className='transition-transform duration-200'
                  />
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {showNavigationMenu && (
        <div
          className={`
          md:hidden absolute top-full left-0 right-0 bg-white border-t border-surface-200 shadow-lg transition-all duration-200 ease-out z-50
          ${isMobileMenuOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
        `}
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='flex flex-col gap-4'>
              {/* Navigation Links Section */}
              <div className='flex flex-col gap-1'>
                <Link
                  href='/dashboard'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg min-h-[44px] flex items-center transition-colors ${
                    activePage === 'dashboard'
                      ? 'text-primary-600 font-medium'
                      : 'text-surface-600 hover:text-surface-900 font-medium hover:bg-surface-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href='/discover'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg min-h-[44px] flex items-center transition-colors ${
                    activePage === 'discover'
                      ? 'text-primary-600 font-medium'
                      : 'text-surface-600 hover:text-surface-900 font-medium hover:bg-surface-50'
                  }`}
                >
                  Discover
                </Link>
                {session?.user && (
                  <Link
                    href={`/profile/${session.user.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`py-3 px-4 rounded-lg min-h-[44px] flex items-center transition-colors ${
                      activePage === 'profile'
                        ? 'text-primary-600 font-medium'
                        : 'text-surface-600 hover:text-surface-900 font-medium hover:bg-surface-50'
                    }`}
                  >
                    {session.user.name || session.user.email}
                  </Link>
                )}
              </div>

              {/* Actions Section */}
              {(actions.length > 0 || shouldShowSignOut || !session?.user) && (
                <div className='flex flex-col gap-2 border-t border-surface-200 pt-4'>
                  {/* Custom actions */}
                  {actions.map((action, index) => (
                    <React.Fragment key={index}>
                      {action.href ? (
                        <ButtonLink
                          href={action.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          variant={
                            action.type === 'text' ? 'clear' : action.type
                          }
                        >
                          {action.label}
                        </ButtonLink>
                      ) : (
                        <Button
                          onClick={() => {
                            action.onClick?.()
                            setIsMobileMenuOpen(false)
                          }}
                          disabled={action.disabled}
                          variant={
                            action.type === 'text' ? 'clear' : action.type
                          }
                        >
                          {action.label}
                        </Button>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Authentication actions */}
                  {session?.user && (
                    <Button onClick={handleSignOut} variant='secondary'>
                      Sign out
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navigation
