import { getCurrentUser } from '@/lib/auth-helpers'
import { PageLayout } from '@/components/layout/PageLayout'
import { ButtonLink } from '@/components/interactive/Button'
import { AccountDeletionSuccess } from '@/components/AccountDeletionSuccess'
import { redirect } from 'next/navigation'

// Force dynamic rendering - no caching
export const dynamic = 'force-dynamic'

/**
 * Homepage - landing page for unauthenticated users
 * Redirects authenticated users to dashboard
 */
export default async function HomePage() {
  const user = await getCurrentUser()

  // Redirect authenticated users to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <PageLayout showNavigationMenu={false}>
      <AccountDeletionSuccess />
      <div className='text-center py-12'>
        <h1 className='text-2xl font-bold text-neutral-900 mb-2'>
          Welcome to CanonCore
        </h1>
        <p className='text-lg text-neutral-700 mb-6'>
          Sign in to start organizing your favorite franchises
        </p>
        <p className='text-sm text-neutral-600 mb-6'>
          CanonCore helps you organize and track your progress through your
          favorite fictional franchises.
        </p>
        <div className='flex flex-col sm:flex-row gap-4 justify-center'>
          <ButtonLink href='/signin' variant='primary'>
            Sign In to Get Started
          </ButtonLink>
          <ButtonLink href='/register' variant='secondary'>
            Create Account
          </ButtonLink>
        </div>
      </div>
    </PageLayout>
  )
}
