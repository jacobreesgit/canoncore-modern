'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { HiMenu, HiX } from 'react-icons/hi'

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
  /** Navigation variant */
  variant?: 'dashboard' | 'detail' | 'form'
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
 * Button styles for actions
 */
const buttonStyles = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition-colors',
  secondary:
    'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium transition-colors border border-gray-300',
  danger:
    'bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded-lg font-medium transition-colors',
  text: 'text-gray-600 hover:text-gray-900 font-medium transition-colors',
}

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
    if (pathname === '/') return 'dashboard'
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
      ? 'text-blue-600 font-medium'
      : 'text-gray-600 hover:text-gray-900 font-medium transition-colors'
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
              <span className='text-xl font-bold text-blue-600'>CanonCore</span>
            ) : (
              <Link
                href='/'
                className='text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors'
              >
                CanonCore
              </Link>
            )}

            {/* Navigation Menu - Desktop only */}
            {showNavigationMenu && (
              <div className='hidden md:flex space-x-6'>
                <Link href='/' className={getLinkClasses('dashboard')}>
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
                    <Link
                      href={action.href}
                      className={buttonStyles[action.type]}
                    >
                      {action.label}
                    </Link>
                  ) : (
                    <button
                      onClick={action.onClick}
                      disabled={action.disabled}
                      className={`${buttonStyles[action.type]} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {action.label}
                    </button>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* User authentication elements */}
            {session?.user ? (
              <div className='hidden md:flex items-center space-x-3'>
                {/* User greeting - only show when nav menu is not shown */}
                {!showNavigationMenu && (
                  <span className='text-gray-700'>
                    Welcome, {session.user.name || session.user.email}
                  </span>
                )}

                {/* Sign out button */}
                {shouldShowSignOut && (
                  <button
                    onClick={handleSignOut}
                    className={buttonStyles.secondary}
                  >
                    Sign out
                  </button>
                )}
              </div>
            ) : (
              /* Sign in for unauthenticated users - Desktop only */
              <div className='hidden md:block'>
                <Link href='/api/auth/signin' className={buttonStyles.primary}>
                  Sign In
                </Link>
              </div>
            )}

            {/* Mobile hamburger menu button */}
            {showNavigationMenu && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className='md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors'
                aria-label='Toggle mobile menu'
              >
                {isMobileMenuOpen ? (
                  <HiX className='h-6 w-6 transition-transform duration-200' />
                ) : (
                  <HiMenu className='h-6 w-6 transition-transform duration-200' />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {showNavigationMenu && (
        <div
          className={`
          md:hidden absolute top-full left-0 right-0 bg-white border-t border-gray-200 shadow-lg transition-all duration-200 ease-out z-50
          ${isMobileMenuOpen ? 'opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}
        `}
        >
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
            <div className='flex flex-col gap-4'>
              {/* Navigation Links Section */}
              <div className='flex flex-col gap-1'>
                <Link
                  href='/'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg min-h-[44px] flex items-center transition-colors ${
                    activePage === 'dashboard'
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href='/discover'
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`py-3 px-4 rounded-lg min-h-[44px] flex items-center transition-colors ${
                    activePage === 'discover'
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-50'
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
                        ? 'text-blue-600 font-medium'
                        : 'text-gray-600 hover:text-gray-900 font-medium hover:bg-gray-50'
                    }`}
                  >
                    {session.user.name || session.user.email}
                  </Link>
                )}
              </div>

              {/* Actions Section */}
              {(actions.length > 0 || shouldShowSignOut || !session?.user) && (
                <div className='flex flex-col gap-2 border-t border-gray-200 pt-4'>
                  {/* Custom actions */}
                  {actions.map((action, index) => (
                    <React.Fragment key={index}>
                      {action.href ? (
                        <Link
                          href={action.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={buttonStyles[action.type]}
                        >
                          {action.label}
                        </Link>
                      ) : (
                        <button
                          onClick={() => {
                            action.onClick?.()
                            setIsMobileMenuOpen(false)
                          }}
                          disabled={action.disabled}
                          className={`${buttonStyles[action.type]} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {action.label}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  {/* Authentication actions */}
                  {session?.user ? (
                    shouldShowSignOut && (
                      <button
                        onClick={handleSignOut}
                        className={buttonStyles.secondary}
                      >
                        Sign out
                      </button>
                    )
                  ) : (
                    <Link
                      href='/api/auth/signin'
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={buttonStyles.primary}
                    >
                      Sign In
                    </Link>
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
