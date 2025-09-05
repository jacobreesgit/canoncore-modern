import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { SignInForm } from '@/components/auth/sign-in-form'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()

  // Redirect authenticated users to dashboard (Context7 best practice)
  if (session?.user?.id) {
    redirect('/dashboard')
  }

  // Show sign-in interface for unauthenticated users
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center">
          <div className="mr-4 flex">
            <Link className="mr-4 flex items-center space-x-2 lg:mr-6" href="/">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <span className="text-sm font-bold">C</span>
              </div>
              <span className="hidden font-bold sm:inline-block">CanonCore</span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <span className="text-sm text-muted-foreground">
                Organize your content universes
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex">
        {/* Left Side - Hero Section */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-lg space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome to CanonCore
              </h1>
              <p className="text-xl text-muted-foreground">
                The complete solution for organizing your content universes and franchises
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="flex h-2 w-2 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Create unlimited universes and collections
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex h-2 w-2 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Organize content in hierarchical structures
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex h-2 w-2 rounded-full bg-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Interactive tree navigation with drag & drop
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Sign In Form */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/50">
          <SignInForm />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built with Next.js, NextAuth.js, and Drizzle ORM
          </p>
        </div>
      </footer>
    </div>
  )
}
