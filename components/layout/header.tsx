/**
 * Site Header Component
 * Reusable header with CanonCore branding and authentication-aware navigation
 * Following Context7 best practices for Next.js navigation patterns
 */

import Link from 'next/link'
import { auth } from '@/auth'

export async function Header() {
  const session = await auth()

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex max-w-screen-2xl items-center justify-between px-8 py-4">
        <div className="flex items-center space-x-6">
          <Link className="flex items-center space-x-2" href="/">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="hidden font-bold sm:inline-block">CanonCore</span>
          </Link>

          {/* Authenticated Navigation */}
          {session?.user && (
            <nav className="hidden md:flex items-center space-x-6" role="navigation" aria-label="Main navigation">
              <Link 
                href="/" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </Link>
              <Link 
                href="/dashboard" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}
