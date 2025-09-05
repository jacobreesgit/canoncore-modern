import { auth } from '@/auth'
import { AuthForm } from '@/components/auth/auth-form'
import { SignOutButton } from '@/components/auth/sign-out-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()

  // Create different content based on authentication state (Context7 best practice)
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

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

        {/* Right Side - Authentication Area */}
        <div className="flex-1 flex items-center justify-center p-8 bg-muted/50">
          {session?.user ? (
            // Authenticated User Welcome
            <Card className="w-full max-w-md">
              <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">
                  Welcome back, {session.user.name}!
                </CardTitle>
                <CardDescription className="text-center">
                  Ready to manage your content universes?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button asChild className="w-full">
                  <Link href="/dashboard">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
                
                <SignOutButton />
              </CardContent>
            </Card>
          ) : (
            // Non-authenticated User Auth Form
            <AuthForm />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
