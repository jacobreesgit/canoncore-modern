/**
 * Site Header Component
 * Reusable header with CanonCore branding following Context7 best practices
 */

import Link from 'next/link'

export function Header() {
  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-8">
        <div className="mr-4 flex">
          <Link className="mr-4 flex items-center space-x-2 lg:mr-6" href="/">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <span className="text-sm font-bold">C</span>
            </div>
            <span className="hidden font-bold sm:inline-block">CanonCore</span>
          </Link>
        </div>
      </div>
    </header>
  )
}